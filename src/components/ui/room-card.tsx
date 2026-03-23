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
      className="flex flex-col space-y-4 p-4 bg-white sketch-border sketch-shadow bg-paper"
    >
      <div className="aspect-video w-full overflow-hidden sketch-border">
        <ReactCompareSlider
          itemOne={<ReactCompareSliderImage src={before} alt="Original Room" />}
          itemTwo={<ReactCompareSliderImage src={after} alt="Redesigned Room" />}
          className="h-full w-full object-cover"
        />
      </div>
      <div className="space-y-2">
        <h3 className="text-3xl font-sketch text-charcoal">{name}</h3>
        <p className="text-muted-foreground font-medium italic leading-relaxed">
          "{description}"
        </p>
      </div>
    </motion.div>
  );
}