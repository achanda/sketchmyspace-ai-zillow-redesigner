import React from 'react';
import { ReactCompareSlider, ReactCompareSliderImage } from 'react-compare-slider';
import { motion } from 'framer-motion';
interface RoomCardProps {
  name: string;
  before: string;
  after: string;
  description: string;
}
export function RoomCard({ name, before, after, description }: RoomCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      className="flex flex-col space-y-4 p-4 bg-white sketch-border sketch-shadow bg-paper max-w-full overflow-hidden"
    >
      <div className="aspect-video w-full overflow-hidden sketch-border">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={before} alt="Original Room" className="object-cover" />}
          itemTwo={<ReactCompareSliderImage src={after} alt="Redesigned Room" className="object-cover" />}
          className="h-full w-full"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-3xl font-sketch text-charcoal truncate">{name}</h3>
        <p className="text-muted-foreground font-display font-medium italic leading-relaxed text-lg">
          "{description}"
        </p>
      </div>
    </motion.div>
  );
}