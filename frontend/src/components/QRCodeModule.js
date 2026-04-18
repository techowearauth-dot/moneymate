import React from 'react';
import { View } from 'react-native';
import Svg, { Rect } from 'react-native-svg';
import qrcode from 'qrcode-generator';

const QRCodeModule = ({ value, size = 200, color = '#000', backgroundColor = 'transparent' }) => {
  // Generate QR Matrix
  const qr = qrcode(0, 'H');
  qr.addData(value || '');
  qr.make();

  const count = qr.getModuleCount();
  const cellSize = size / count;

  const cells = [];
  for (let row = 0; row < count; row++) {
    for (let col = 0; col < count; col++) {
      if (qr.isDark(row, col)) {
        cells.push(
          <Rect
            key={`${row}-${col}`}
            x={col * cellSize}
            y={row * cellSize}
            width={cellSize}
            height={cellSize}
            fill={color}
          />
        );
      }
    }
  }

  return (
    <View style={{ width: size, height: size, backgroundColor }}>
      <Svg width={size} height={size}>
        {cells}
      </Svg>
    </View>
  );
};

export default QRCodeModule;
