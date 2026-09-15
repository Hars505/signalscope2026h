import React from 'react';
import { motion } from 'framer-motion';
import { formatConfidence } from '../../lib/utils';
import { Info } from 'lucide-react';
import { Tooltip } from '../ui/Tooltip';

export const ConfidenceMeter = ({
  confidence,
  label,
  accentColor = '#10A760',
  size = 180,
}) => {
  const strokeWidth = 12;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - confidence * circumference;

  return (
    <div className="flex flex-col items-center justify-center relative">
      <div className="relative" style={{ width: size, height: size }}>
        <svg
          width={size}
          height={size}
          className="transform -rotate-90 origin-center"
        >
          <circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            className="stroke-emerald-800/12 dark:stroke-[#1B6348]"
            strokeWidth={strokeWidth}
            fill="transparent"
          />

          <motion.circle
            cx={size / 2}
            cy={size / 2}
            r={radius}
            stroke={accentColor}
            strokeWidth={strokeWidth}
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1.2, ease: [0.16, 1, 0.3, 1] }}
            strokeLinecap="round"
            fill="transparent"
            style={{
              filter: `drop-shadow(0 0 8px ${accentColor}55)`,
            }}
          />
        </svg>

        <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
          <motion.span
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.4 }}
            className="text-3xl sm:text-4xl font-extrabold font-mono text-[#0D331E] dark:text-[#E7F5EE] tracking-tight"
          >
            {formatConfidence(confidence)}
          </motion.span>
          <span className="text-[11px] font-mono uppercase tracking-widest text-[#3D5C49] dark:text-[#A8C7B8] mt-1 font-semibold">
            Confidence
          </span>
        </div>
      </div>

      <div className="mt-3 flex items-center gap-1.5 text-xs text-[#3D5C49] dark:text-[#A8C7B8]">
        <span>Calibrated Probability</span>
        <Tooltip content="Scaled via empirical temperature validation so confidence matches true statistical accuracy.">
          <Info className="w-3.5 h-3.5 text-[#688A75] dark:text-[#769789] hover:text-[#0D331E] dark:hover:text-[#E7F5EE] cursor-help" />
        </Tooltip>
      </div>
    </div>
  );
};
