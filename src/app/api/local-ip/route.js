import { NextResponse } from 'next/server';
import os from 'os';

export async function GET() {
  const networkInterfaces = os.networkInterfaces();
  let localIp = 'localhost';
  
  for (const interfaceName in networkInterfaces) {
    const interfaces = networkInterfaces[interfaceName];
    for (const iface of interfaces) {
      if ((iface.family === 'IPv4' || iface.family === 4) && !iface.internal) {
        localIp = iface.address;
        break;
      }
    }
    if (localIp !== 'localhost') break;
  }
  
  return NextResponse.json({ ip: localIp });
}
