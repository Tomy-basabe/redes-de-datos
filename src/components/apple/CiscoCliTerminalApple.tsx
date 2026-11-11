import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Terminal as TerminalIcon, Shield, CheckCircle2, Play, CornerDownLeft } from 'lucide-react';

export const CiscoCliTerminalApple: React.FC = () => {
  const [command, setCommand] = useState<string>('');
  const [output, setOutput] = useState<string[]>(`Cisco IOS Software, C9200 Software (C9200-UNIVERSALK9-M), Version 17.6.3
Copyright (c) 1986-2022 by Cisco Systems, Inc.
Switch-Corralitos-C9200#`.split('\n'));

  const presets = [
    { label: 'show run interface Vlan20', cmd: 'show run interface Vlan20' },
    { label: 'show access-lists 101', cmd: 'show access-lists 101' },
    { label: 'show ip helper-address', cmd: 'show ip helper-address' },
    { label: 'ping 172.16.10.12 (Nginx)', cmd: 'ping 172.16.10.12' },
  ];

  const executeCmd = (cmdToRun: string) => {
    const cleanCmd = cmdToRun.trim().toLowerCase();
    let response: string[] = [];

    if (cleanCmd.includes('interface vlan20')) {
      response = [
        `Switch-Corralitos-C9200# show run interface Vlan20`,
        `Building configuration...`,
        `Current configuration : 180 bytes`,
        `!`,
        `interface Vlan20`,
        ` description Red de Estudiantes - Escuela 4-025 Los Corralitos`,
        ` ip address 172.16.20.1 255.255.255.0`,
        ` ip access-group 101 in`,
        ` ip helper-address 172.16.10.14`,
        ` no shutdown`,
        `end`,
        `Switch-Corralitos-C9200#`
      ];
    } else if (cleanCmd.includes('access-lists') || cleanCmd.includes('acl')) {
      response = [
        `Switch-Corralitos-C9200# show access-lists 101`,
        `Extended IP access list 101`,
        `    10 permit tcp 172.16.20.0 0.0.0.255 host 172.16.10.12 eq 443 (8432 matches)`,
        `    20 permit tcp 172.16.20.0 0.0.0.255 host 172.16.10.12 eq 80 (1290 matches)`,
        `    30 permit tcp 172.16.20.0 0.0.0.255 host 172.16.10.13 eq 445 (4102 matches)`,
        `    40 deny tcp 172.16.20.0 0.0.0.255 host 172.16.10.11 eq 8080 log (48 matches - DROP REJECT)`,
        `    50 permit ip any any`,
        `Switch-Corralitos-C9200#`
      ];
    } else if (cleanCmd.includes('helper-address') || cleanCmd.includes('dhcp')) {
      response = [
        `Switch-Corralitos-C9200# show ip helper-address`,
        `Interface        Helper-Address      Status`,
        `Vlan20           172.16.10.14        Active (Forwarding UDP 67/68 to Unicast)`,
        `Vlan30           172.16.10.14        Active (Forwarding UDP 67/68 to Unicast)`,
        `Vlan50           172.16.10.14        Active (Forwarding UDP 67/68 to Unicast)`,
        `Switch-Corralitos-C9200#`
      ];
    } else if (cleanCmd.includes('ping')) {
      response = [
        `Switch-Corralitos-C9200# ping 172.16.10.12`,
        `Type escape sequence to abort.`,
        `Sending 5, 100-byte ICMP Echos to 172.16.10.12, timeout is 2 seconds:`,
        `!!!!!`,
        `Success rate is 100 percent (5/5), round-trip min/avg/max = 1/2/4 ms`,
        `Switch-Corralitos-C9200#`
      ];
    } else {
      response = [
        `Switch-Corralitos-C9200# ${cmdToRun}`,
        `% Comandos recomendados:`,
        `  show run interface Vlan20`,
        `  show access-lists 101`,
        `  show ip helper-address`,
        `  ping 172.16.10.12`,
        `Switch-Corralitos-C9200#`
      ];
    }

    setOutput((prev) => [...prev, ...response]);
    setCommand('');
  };

  return (
    <section id="cisco-terminal" className="py-24 px-6 max-w-7xl mx-auto space-y-12">
      <div className="text-center space-y-4 max-w-3xl mx-auto">
        <span className="text-xs font-mono uppercase tracking-widest text-cyan-400 font-semibold">
          Consola Operativa L4 • Cisco Catalyst C9200
        </span>
        <h2 className="text-3xl sm:text-5xl font-bold apple-headline text-white">
          Terminal Cisco IOS en Vivo.
        </h2>
        <p className="text-zinc-400 text-base sm:text-lg apple-subheadline">
          Inspecciona directamente las reglas de enrutamiento inter-VLAN, el DHCP Relay y las listas de control de acceso configuradas en el núcleo de la red.
        </p>

        {/* Presets de Comandos */}
        <div className="flex flex-wrap items-center justify-center gap-2 mt-2">
          {presets.map((p) => (
            <button
              key={p.cmd}
              onClick={() => executeCmd(p.cmd)}
              className="px-4 py-1.5 rounded-full text-xs font-mono bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-zinc-300 transition-all cursor-pointer flex items-center gap-1.5"
            >
              <Play className="w-3 h-3 text-cyan-400" />
              <span>{p.label}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Ventana de Terminal Cisco */}
      <div className="p-6 sm:p-8 rounded-[36px] bg-[#0c0d12] border border-white/[0.1] shadow-2xl space-y-4 max-w-4xl mx-auto">
        <div className="flex items-center justify-between border-b border-white/[0.06] pb-3 text-xs font-mono text-zinc-500">
          <div className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-rose-500/80" />
            <span className="w-3 h-3 rounded-full bg-amber-500/80" />
            <span className="w-3 h-3 rounded-full bg-emerald-500/80" />
            <span className="ml-2 text-zinc-400">Switch-Corralitos-C9200 (ssh cisco@172.16.10.1)</span>
          </div>
          <span>Cisco IOS 17.6.3</span>
        </div>

        {/* Contenido Terminal con Scroll */}
        <div className="h-72 overflow-y-auto font-mono text-xs text-zinc-300 space-y-1 pr-2 no-scrollbar">
          {output.map((line, idx) => (
            <div key={idx} className={line.includes('deny') ? 'text-rose-400 font-bold' : line.includes('permit') ? 'text-emerald-400' : ''}>
              {line}
            </div>
          ))}
        </div>

        {/* Input de Comandos */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            if (command) executeCmd(command);
          }}
          className="flex items-center gap-2 pt-2 border-t border-white/[0.06] font-mono text-xs"
        >
          <span className="text-cyan-400 font-bold shrink-0">Switch-Corralitos-C9200#</span>
          <input
            type="text"
            value={command}
            onChange={(e) => setCommand(e.target.value)}
            placeholder="Escribe un comando Cisco o usa los botones superiores..."
            className="flex-1 bg-transparent text-white outline-none placeholder:text-zinc-600 font-mono"
          />
          <button
            type="submit"
            className="p-2 rounded-lg bg-white/[0.08] hover:bg-white/[0.15] text-zinc-300 transition-colors cursor-pointer"
          >
            <CornerDownLeft className="w-4 h-4" />
          </button>
        </form>
      </div>
    </section>
  );
};
