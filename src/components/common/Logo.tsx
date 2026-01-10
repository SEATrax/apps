import Image from 'next/image';
import Link from 'next/link';
import { cn } from '@/lib/utils';

interface LogoProps {
  variant?: 'navbar' | 'footer' | 'icon' | 'full';
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  href?: string;
  className?: string;
}

// Size config: height-based to maintain aspect ratio
// navbar.png: 720x183 (aspect ~3.93:1)
// logo.png: 767x363 (aspect ~2.11:1)
// icon.png: 840x848 (square)
const sizeConfig = {
  sm: { height: 40, width: 160, className: 'h-10' },        // 40px height - footer (larger)
  md: { height: 56, width: 220, className: 'h-14' },        // 56px height - navbar (smaller)
  lg: { height: 72, width: 283, className: 'h-[72px]' },    // 72px height - large
  xl: { height: 200, width: 423, className: 'h-[200px]' },  // 200px height - hero
  '2xl': { height: 280, width: 592, className: 'h-[280px]' }, // 280px height - extra large
};

// Mobile icon size (square icon.png)
const mobileIconSize = {
  height: 40,
  width: 40,
  className: 'h-10 w-10',
};

// Logo file mapping:
// - navbar.png: Logo with text (for navbar) - 720x183
// - icon.png: Icon only - 840x848 (square)
// - logo.png: Full logo with text (for homepage/hero) - 767x363
const logoFiles = {
  navbar: '/navbar.png',
  footer: '/navbar.png', // Use navbar.png for footer
  icon: '/icon.png',
  full: '/logo.png',
};

export function Logo({
  variant = 'navbar',
  size = 'md',
  href,
  className,
}: LogoProps) {
  const { height, width, className: sizeClass } = sizeConfig[size];
  const logoSrc = logoFiles[variant];

  // For navbar variant, show icon.png on mobile and navbar.png on desktop
  const isNavbar = variant === 'navbar';

  const LogoContent = () => (
    <div className={cn('relative inline-block', className)}>
      {isNavbar ? (
        <>
          {/* Mobile: Square icon */}
          <Image
            src={logoFiles.icon}
            alt="SEATrax"
            width={mobileIconSize.width}
            height={mobileIconSize.height}
            priority
            unoptimized
            className={cn('object-contain md:hidden', mobileIconSize.className)}
          />
          {/* Desktop: Rectangle navbar logo */}
          <Image
            src={logoSrc}
            alt="SEATrax Logo"
            width={width}
            height={height}
            priority
            unoptimized
            className={cn('object-contain hidden md:block', sizeClass)}
            style={{ width: 'auto', maxHeight: '100%' }}
          />
        </>
      ) : (
        <Image
          src={logoSrc}
          alt="SEATrax Logo"
          width={width}
          height={height}
          priority
          unoptimized
          className={cn('object-contain', sizeClass)}
          style={{ width: 'auto', maxHeight: '100%' }}
        />
      )}
    </div>
  );

  if (href) {
    return (
      <Link href={href} className="inline-flex">
        <LogoContent />
      </Link>
    );
  }

  return <LogoContent />;
}
