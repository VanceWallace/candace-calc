import { useState } from 'react';
import { View } from 'react-native';
import Svg, { Path } from 'react-native-svg';

const TILE = 10;
export const TORN_EDGE_HEIGHT = 7.5;

/**
 * The torn top edge of the paper. Same geometry as the prototype's CSS mask: in each 10px tile,
 * paper fills a wedge rising from the tile's bottom centre (-45° to +31° from vertical), with a
 * faint fringe out to +59°.
 */
export function TornEdge({ color }: { color: string }) {
  const [width, setWidth] = useState(0);
  const h = TORN_EDGE_HEIGHT;
  let solid = '';
  let fringe = '';
  for (let x = 0; x < width; x += TILE) {
    solid += `M${x} 0H${x + 9.5}L${x + 5} ${h}L${x} ${h - 5}Z`;
    fringe += `M${x + 9.5} 0H${x + 10}V${h - 3}L${x + 5} ${h}Z`;
  }
  return (
    <View style={{ height: h + 0.5 }} onLayout={(e) => setWidth(e.nativeEvent.layout.width)}>
      {width > 0 && (
        <Svg width={width} height={h + 0.5}>
          <Path d={`M0 ${h - 0.5}H${width}V${h + 0.5}H0Z`} fill={color} />
          <Path d={solid} fill={color} />
          <Path d={fringe} fill={color} opacity={0.3} />
        </Svg>
      )}
    </View>
  );
}
