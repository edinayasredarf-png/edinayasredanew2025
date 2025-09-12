import React from 'react';
import Link from 'next/link';

interface ButtonProps {
  children: React.ReactNode;
  href?: string;
  onClick?: () => void;
  className?: string;
  type?: 'button' | 'submit' | 'reset';
  variant?: 'primary' | 'secondary';
  size?: 'normal' | 'large';
}

const base =
  'inline-flex items-center justify-center font-medium rounded-xl transition-colors duration-200 focus:outline-none';

const sizeVariants = {
  normal: 'px-4 py-2.5 md:px-5 text-base md:text-lg',
  large: 'px-6 py-4 md:px-8 md:py-5 text-lg md:text-2xl',
};

const variants = {
  primary:
    'bg-[#0077FF] text-white hover:bg-[#0077FF]/90',
  secondary:
    'bg-white text-[#0077FF] border border-[#0077FF] hover:bg-[#0077FF]/10',
};

const Button: React.FC<ButtonProps> = ({
  children,
  href,
  onClick,
  className = '',
  type = 'button',
  variant = 'primary',
  size = 'normal',
}) => {
  const classes = `${base} ${variants[variant]} ${sizeVariants[size]} ${className}`;
  if (href) {
    return (
      <Link href={href} className={classes}>
        {children}
      </Link>
    );
  }
  return (
    <button type={type} onClick={onClick} className={classes}>
      {children}
    </button>
  );
};

export default Button;