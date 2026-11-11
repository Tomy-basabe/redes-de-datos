/**
 * MOTOR DE CÁLCULO DE CHECKSUM TCP / UDP EN COMPLEMENTO A UNO (RFC 793 / RFC 1071)
 * Diseñado para demostración pedagógica e interactiva con palabras de 16 bits.
 */

export interface ChecksumWord {
  label: string;
  hex: string;
  bin: string;
  val: number;
}

export interface ChecksumCalculationResult {
  words: ChecksumWord[];
  rawSum: number;
  rawSumHex: string;
  carryBits: number;
  sumAfterCarry: number;
  sumAfterCarryHex: string;
  checksum: number;
  checksumHex: string;
  checksumBin: string;
  // Verificación en receptor
  receiverWords: ChecksumWord[];
  receiverSum: number;
  receiverFinal: number;
  isValid: boolean;
  corruptedBitIndex?: number;
}

/**
 * Convierte un número de 16 bits a string hexadecimal de 4 dígitos con prefijo 0x
 */
export const toHex16 = (val: number): string => {
  return '0x' + (val & 0xFFFF).toString(16).toUpperCase().padStart(4, '0');
};

/**
 * Convierte un número de 16 bits a binario de 16 bits con espacios cada 4 bits
 */
export const toBin16 = (val: number): string => {
  const b = (val & 0xFFFF).toString(2).padStart(16, '0');
  return `${b.slice(0, 4)} ${b.slice(4, 8)} ${b.slice(8, 12)} ${b.slice(12, 16)}`;
};

/**
 * Calcula el checksum de un segmento TCP real (incluyendo pseudocabecera IP de la Escuela Los Corralitos)
 */
export const calculateTcpChecksum = (
  srcIp: string = '172.16.20.10',
  dstIp: string = '172.16.10.12',
  srcPort: number = 53000,
  dstPort: number = 443,
  seq: number = 1000,
  ack: number = 0,
  window: number = 64240,
  payloadText: string = 'GET / HTTP/1.1',
  corruptBit: boolean = false
): ChecksumCalculationResult => {
  const words: ChecksumWord[] = [];

  // 1. Pseudocabecera IP (RFC 793)
  // IP Origen (172.16.20.10 -> 0xAC10, 0x140A)
  const srcOctets = srcIp.split('.').map(Number);
  const srcWord1 = (srcOctets[0] << 8) | srcOctets[1];
  const srcWord2 = (srcOctets[2] << 8) | srcOctets[3];
  words.push({ label: 'IP Origen (Parte 1)', val: srcWord1, hex: toHex16(srcWord1), bin: toBin16(srcWord1) });
  words.push({ label: 'IP Origen (Parte 2)', val: srcWord2, hex: toHex16(srcWord2), bin: toBin16(srcWord2) });

  // IP Destino (172.16.10.12 -> 0xAC10, 0x0A0C)
  const dstOctets = dstIp.split('.').map(Number);
  const dstWord1 = (dstOctets[0] << 8) | dstOctets[1];
  const dstWord2 = (dstOctets[2] << 8) | dstOctets[3];
  words.push({ label: 'IP Destino (Parte 1)', val: dstWord1, hex: toHex16(dstWord1), bin: toBin16(dstWord1) });
  words.push({ label: 'IP Destino (Parte 2)', val: dstWord2, hex: toHex16(dstWord2), bin: toBin16(dstWord2) });

  // Reservado (0x00) + Protocolo TCP (0x06 = 6) -> 0x0006
  words.push({ label: 'Ceros (8b) + Proto TCP (8b)', val: 0x0006, hex: '0x0006', bin: toBin16(0x0006) });

  // Longitud TCP (Cabecera 20B + Payload)
  const tcpLength = 20 + payloadText.length;
  words.push({ label: 'Longitud TCP Total', val: tcpLength, hex: toHex16(tcpLength), bin: toBin16(tcpLength) });

  // 2. Cabecera TCP
  words.push({ label: 'Puerto Origen TCP', val: srcPort, hex: toHex16(srcPort), bin: toBin16(srcPort) });
  words.push({ label: 'Puerto Destino TCP', val: dstPort, hex: toHex16(dstPort), bin: toBin16(dstPort) });

  const seq1 = (seq >> 16) & 0xFFFF;
  const seq2 = seq & 0xFFFF;
  words.push({ label: 'Número Secuencia (Alta)', val: seq1, hex: toHex16(seq1), bin: toBin16(seq1) });
  words.push({ label: 'Número Secuencia (Baja)', val: seq2, hex: toHex16(seq2), bin: toBin16(seq2) });

  const ack1 = (ack >> 16) & 0xFFFF;
  const ack2 = ack & 0xFFFF;
  words.push({ label: 'Número ACK (Alta)', val: ack1, hex: toHex16(ack1), bin: toBin16(ack1) });
  words.push({ label: 'Número ACK (Baja)', val: ack2, hex: toHex16(ack2), bin: toBin16(ack2) });

  // Data offset (5 palabras de 32 bits = 0x5) + Flags (SYN = 0x002) -> 0x5002
  const offsetAndFlags = 0x5002;
  words.push({ label: 'Offset (5) + Flags [SYN]', val: offsetAndFlags, hex: toHex16(offsetAndFlags), bin: toBin16(offsetAndFlags) });

  // Window Size
  words.push({ label: 'Ventana de Recepción (rwnd)', val: window, hex: toHex16(window), bin: toBin16(window) });

  // Checksum temporal para el cálculo del emisor = 0x0000
  words.push({ label: 'Checksum Emisor (0x0000)', val: 0x0000, hex: '0x0000', bin: toBin16(0x0000) });

  // Puntero Urgente
  words.push({ label: 'Puntero Urgente', val: 0x0000, hex: '0x0000', bin: toBin16(0x0000) });

  // 3. Payload / Datos de aplicación en bloques de 16 bits
  for (let i = 0; i < payloadText.length; i += 2) {
    const c1 = payloadText.charCodeAt(i);
    const c2 = i + 1 < payloadText.length ? payloadText.charCodeAt(i + 1) : 0;
    const wordVal = (c1 << 8) | c2;
    words.push({
      label: `Dato '${payloadText.slice(i, i + 2)}'`,
      val: wordVal,
      hex: toHex16(wordVal),
      bin: toBin16(wordVal)
    });
  }

  // 4. Suma en complemento a uno
  let rawSum = 0;
  for (const w of words) {
    rawSum += w.val;
  }

  // 5. Wrap-around carry (acarreo)
  let sumAfterCarry = rawSum;
  let carryBits = sumAfterCarry >> 16;
  while (carryBits > 0) {
    sumAfterCarry = (sumAfterCarry & 0xFFFF) + carryBits;
    carryBits = sumAfterCarry >> 16;
  }

  // 6. Inversión bit a bit (NOT)
  const checksum = ~sumAfterCarry & 0xFFFF;

  // 7. Simulación en el receptor
  // El receptor recibe las palabras con el checksum calculado colocado en su campo
  const receiverWords = words.map((w) => {
    if (w.label.includes('Checksum Emisor')) {
      let finalChecksum = checksum;
      if (corruptBit) {
        // Invertimos un bit para provocar error de comprobación
        finalChecksum = finalChecksum ^ 0x0001;
      }
      return {
        label: 'Checksum Recibido en la Trama',
        val: finalChecksum,
        hex: toHex16(finalChecksum),
        bin: toBin16(finalChecksum)
      };
    }
    // Si se activa corrupción en los datos
    if (corruptBit && w.label.includes('Dato')) {
      const corruptedVal = w.val ^ 0x0004;
      return {
        label: w.label + ' [ALTERADO POR RUIDO]',
        val: corruptedVal,
        hex: toHex16(corruptedVal),
        bin: toBin16(corruptedVal)
      };
    }
    return { ...w };
  });

  let receiverSum = 0;
  for (const rw of receiverWords) {
    receiverSum += rw.val;
  }

  let receiverAfterCarry = receiverSum;
  let rCarry = receiverAfterCarry >> 16;
  while (rCarry > 0) {
    receiverAfterCarry = (receiverAfterCarry & 0xFFFF) + rCarry;
    rCarry = receiverAfterCarry >> 16;
  }

  const receiverFinal = ~receiverAfterCarry & 0xFFFF;
  // Es válido si la suma de todas las palabras incluido el checksum da 0xFFFF (es decir, el inverso da 0x0000)
  const isValid = receiverFinal === 0;

  return {
    words,
    rawSum,
    rawSumHex: '0x' + rawSum.toString(16).toUpperCase(),
    carryBits: rawSum >> 16,
    sumAfterCarry,
    sumAfterCarryHex: toHex16(sumAfterCarry),
    checksum,
    checksumHex: toHex16(checksum),
    checksumBin: toBin16(checksum),
    receiverWords,
    receiverSum,
    receiverFinal,
    isValid,
    corruptedBitIndex: corruptBit ? 0 : undefined
  };
};
