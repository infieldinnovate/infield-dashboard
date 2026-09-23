'use client';

import React from 'react';
import * as Icons from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface IconProps {
  name: string;
  size?: number;
  className?: string;
}

export default function Icon({ name, size = 20, className = '' }: IconProps) {
  const IconComponent = (Icons as unknown as Record<string, LucideIcon>)[name];

  if (!IconComponent) {
    return null;
  }

  return <IconComponent size={size} className={className} />;
}
