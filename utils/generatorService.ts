// types.ts content moved here for simplicity in this structure
export interface ClientInfo {
  clientID: string;
  clientIPSuffix: string;
  clientWgIP: string;
  lanNetwork?: string;
  dhcpStart?: string;
  dhcpEnd?: string;
  dnsServers?: string;
  clientPubKey?: string;
  setupDNAT?: boolean;
  setupWatchdog?: boolean;
  cameraType?: string;
  numCameras?: number;
  portBase?: number;
  cameraIPs?: string[];
  includeLanNetwork?: boolean;
}

export const validateClientID = (clientID: string): string | null => {
  const cleanID = clientID.toUpperCase().trim();
  const regex = /^[A-Z0-9-]+$/;

  if (!cleanID || cleanID.length === 0) return null;
  if (!regex.test(cleanID)) return null;
  return cleanID;
};

// =========================================================================
// 1. BASE CONFIG
// =========================================================================
export const generateBaseConfig = (info: ClientInfo): string => {
  return `# ================================================================
# CONFIGURACION BASE PARA CLIENTE: ${info.clientID}
# IP WireGuard: ${info.clientWgIP}
# Red LAN: ${info.lanNetwork}.0/24
# ================================================================

# 1. CONFIGURACION BASICA DE RED
/interface bridge add name=LAN-Bridge comment="Red Local"
/interface bridge port add bridge=LAN-Bridge interface=ether2 comment="Puerto LAN"
/interface bridge port add bridge=LAN-Bridge interface=ether3 comment="Puerto LAN"
/interface bridge port add bridge=LAN-Bridge interface=ether4 comment="Puerto LAN"
/interface bridge port add bridge=LAN-Bridge interface=ether5 comment="Puerto LAN"

# 2. CONFIGURACION IP
/ip address add address=${info.lanNetwork}.1/24 interface=LAN-Bridge comment="IP Router"
/ip dhcp-client add interface=ether1 disabled=no comment="Internet"

# 3. CONFIGURACION DNS
/ip dns set servers=${info.dnsServers} allow-remote-requests=yes

# 4. CONFIGURACION DHCP
/ip pool add name=pool-lan ranges=${info.lanNetwork}.${info.dhcpStart}-${info.lanNetwork}.${info.dhcpEnd}
/ip dhcp-server add name=dhcp-lan interface=LAN-Bridge address-pool=pool-lan disabled=no
/ip dhcp-server network add address=${info.lanNetwork}.0/24 gateway=${info.lanNetwork}.1 dns-server=${info.dnsServers}

# 5. CONFIGURACION NAT
/ip firewall nat add chain=srcnat out-interface=ether1 action=masquerade comment="Internet NAT"

# 6. SEGURIDAD BASICA
/user set admin password="StS2021!!"
`;
};

// =========================================================================
// 2. WIREGUARD CONFIG
// =========================================================================
export const generateWireGuardConfig = (info: ClientInfo): string => {
  let allowedNetworks = "172.16.100.0/24,100.100.100.1/32";
  if (info.lanNetwork) {
    allowedNetworks += `,${info.lanNetwork}.0/24`;
  }

  return `# ================================================================
# CONFIGURACION WIREGUARD PARA CLIENTE: ${info.clientID}
# IP WireGuard: ${info.clientWgIP}
# ================================================================

# CONFIGURACION WIREGUARD
/interface wireguard add name=WIREGUARD-${info.clientID} comment="WireGuard ${info.clientID}" listen-port=13231
/ip address add address=${info.clientWgIP}/24 interface=WIREGUARD-${info.clientID} comment="WireGuard IP"

# PEER (SERVIDOR)
/interface wireguard peers add interface=WIREGUARD-${info.clientID} name=SERVER-${info.clientID} comment="Servidor ${info.clientID}" public-key="F3o4DvZO1WJCoxS9jQOAD1K2+9CXIw6WAyL1LTNsCQg=" endpoint-address="mikrotik-sts.cr-safe.com" endpoint-port=13231 allowed-address="${allowedNetworks}" persistent-keepalive=25s

# RUTAS
/ip route add dst-address=172.16.100.0/24 gateway=100.100.100.1 comment="Ruta WireGuard"

# REGLAS FIREWALL
/ip firewall filter add chain=forward in-interface=WIREGUARD-${info.clientID} out-interface=LAN-Bridge action=accept comment="WG->LAN ${info.clientID}"
/ip firewall filter add chain=forward in-interface=LAN-Bridge out-interface=WIREGUARD-${info.clientID} action=accept comment="LAN->WG ${info.clientID}"
/ip firewall filter add chain=forward src-address=172.16.100.0/24 in-interface=WIREGUARD-${info.clientID} out-interface=LAN-Bridge action=accept comment="Monitoreo->LAN ${info.clientID}"
`;
};

// =========================================================================
// 3. DNAT CONFIG
// =========================================================================
export const generateDNATConfig = (info: ClientInfo): string => {
  if (!info.cameraIPs || !info.portBase) return "";

  let config = `# ================================================================
# CONFIGURACION DNAT PARA CAMARAS ${info.cameraType}
# Cliente: ${info.clientID}
# Base de puertos: ${info.portBase}
# ================================================================
`;

  info.cameraIPs.forEach((cameraIP, index) => {
    const cameraNum = index + 1;
    const httpPort = (info.portBase || 8000) + cameraNum;
    const rtspPort = (info.portBase || 8000) + cameraNum + 50;

    config += `
# Camara ${cameraNum} (${cameraIP})
/ip firewall nat add chain=dstnat in-interface=WIREGUARD-${info.clientID} dst-address=${info.clientWgIP} protocol=tcp dst-port=${httpPort} action=dst-nat to-addresses=${cameraIP} to-ports=80 comment="HTTP Cam${cameraNum} ${info.clientID}"
/ip firewall nat add chain=dstnat src-address=172.16.100.0/24 dst-address=${info.clientWgIP} protocol=tcp dst-port=${httpPort} action=dst-nat to-addresses=${cameraIP} to-ports=80 comment="HTTP-MON Cam${cameraNum} ${info.clientID}"
/ip firewall nat add chain=dstnat in-interface=WIREGUARD-${info.clientID} dst-address=${info.clientWgIP} protocol=tcp dst-port=${rtspPort} action=dst-nat to-addresses=${cameraIP} to-ports=554 comment="RTSP Cam${cameraNum} ${info.clientID}"
/ip firewall nat add chain=dstnat src-address=172.16.100.0/24 dst-address=${info.clientWgIP} protocol=tcp dst-port=${rtspPort} action=dst-nat to-addresses=${cameraIP} to-ports=554 comment="RTSP-MON Cam${cameraNum} ${info.clientID}"
/ip firewall nat add chain=dstnat in-interface=WIREGUARD-${info.clientID} dst-address=${info.clientWgIP} protocol=udp dst-port=${rtspPort} action=dst-nat to-addresses=${cameraIP} to-ports=554 comment="RTSP-UDP Cam${cameraNum} ${info.clientID}"
/ip firewall nat add chain=dstnat src-address=172.16.100.0/24 dst-address=${info.clientWgIP} protocol=udp dst-port=${rtspPort} action=dst-nat to-addresses=${cameraIP} to-ports=554 comment="RTSP-UDP-MON Cam${cameraNum} ${info.clientID}"
`;
  });

  return config;
};

// =========================================================================
// 4. IMPROVED WATCHDOG (NON-INTRUSIVE)
// =========================================================================
export const generateWatchdogScripts = (info: ClientInfo): string => {
  return `# ================================================================
# NUEVO WATCHDOG AUTOMATICO: "SAFE PULSE"
# Metodo: No apaga la interfaz. Fuerza reinicio de socket cambiando puerto.
# Ventaja: Elimina riesgo de que la interfaz quede apagada permanentemente.
# ================================================================

# Script de Auto-Curacion
/system script add name=auto-heal-wireguard policy=ftp,reboot,read,write,policy,test,password,sniff,sensitive,romon source={
    :local wgName "WIREGUARD-${info.clientID}"
    :local targetIp "100.100.100.1"
    :local pingCount 5
    
    # Verificamos conectividad
    :if ([/ping $targetIp count=$pingCount interval=1] = 0) do={
        :log error "[$info.clientID Watchdog] Conexion perdida con servidor. Iniciando protocolo de recuperacion..."
        
        # PASO 1: Limpiar conexiones estancadas (Connection Tracking)
        # A veces UDP se queda "pegado" en el firewall
        :log info "[$info.clientID Watchdog] Limpiando conexiones UDP estancadas..."
        /ip firewall connection remove [find where timeout>0 and dst-address~":13231" protocol=udp]
        
        # PASO 2: Reinicio Suave del Socket (Pulse)
        # Cambiamos el puerto de escucha momentaneamente. 
        # Esto obliga al kernel a reiniciar el socket sin deshabilitar la interfaz.
        :local currentPort [/interface wireguard get [find name=$wgName] listen-port]
        :local tempPort ($currentPort + 1)
        
        :log warning "[$info.clientID Watchdog] Realizando pulso de puerto ($currentPort -> $tempPort -> $currentPort)"
        
        # Cambio temporal
        /interface wireguard set [find name=$wgName] listen-port=$tempPort
        :delay 2s
        
        # Restauracion
        /interface wireguard set [find name=$wgName] listen-port=$currentPort
        
        :log info "[$info.clientID Watchdog] Protocolo finalizado. Esperando reconexion..."
    } else={
        :log info "[$info.clientID Watchdog] Sistema estable. Ping OK."
    }
}

# Scheduler (Ejecuta cada 5 minutos)
/system scheduler add name=schedule-auto-heal interval=5m on-event=auto-heal-wireguard start-time=startup comment="Watchdog WireGuard Non-Stop"

# ================================================================
# NOTA: Este metodo NO requiere cambiar el device-mode a disabled
# Funciona en modo estandar ya que no modifica configuracion critica de boot.
# ================================================================
`;
};

// =========================================================================
// 5. SERVER COMMANDS
// =========================================================================
export const generateServerCommands = (info: ClientInfo): string => {
  let allowedAddress = `${info.clientWgIP}/32`;
  if (info.lanNetwork) {
    allowedAddress += `,${info.lanNetwork}.0/24`;
  }

  let commands = `# ================================================================
# COMANDOS PARA EL SERVIDOR WIREGUARD
# Cliente: ${info.clientID}
# IP: ${info.clientWgIP}
${info.clientPubKey ? `# Llave Publica: ${info.clientPubKey}` : ''}
# ================================================================

# Agregar Peer
/interface wireguard peers add interface=wireguard-server name=${info.clientID} comment="${info.clientID} / IP ${info.clientIPSuffix}" public-key="${info.clientPubKey || '[INSERTAR_CLAVE_PUBLICA]'}" allowed-address=${allowedAddress} persistent-keepalive=25s
`;

  if (info.lanNetwork) {
    commands += `
# Agregar Ruta
/ip route add dst-address=${info.lanNetwork}.0/24 gateway=${info.clientWgIP} comment="Ruta ${info.clientID}"
`;
  }

  return commands;
};