import React, { useState } from 'react';
import { Link, useLocation } from 'wouter';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { CameraIcon, MenuIcon, LayoutDashboardIcon, CrownIcon } from 'lucide-react';

export default function Header() {
  const [location] = useLocation();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  
  // For demo purposes, assume we're logged in with a user
  const user = {
    name: 'User',
    subscription: 'free'
  };
  
  const isPremium = user.subscription === 'premium';
  
  const navItems = [
    { href: '/', label: 'Identify', icon: CameraIcon },
    { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboardIcon },
    { href: '/subscription', label: 'Subscription', icon: CrownIcon },
  ];
  
  return (
    <header className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex items-center justify-between h-14 px-4 max-w-screen-xl mx-auto">
        <div className="flex items-center gap-2">
          <Link href="/" className="flex items-center gap-2 font-semibold text-lg">
            <CameraIcon className="h-5 w-5" />
            <span>BirdLens</span>
            {isPremium && (
              <span className="text-xs px-1.5 py-0.5 rounded bg-gradient-to-r from-amber-500 to-amber-300 text-white font-medium">
                Premium
              </span>
            )}
          </Link>
        </div>
        
        {/* Desktop navigation */}
        <nav className="hidden md:flex items-center gap-1">
          {navItems.map((item) => (
            <Link key={item.href} href={item.href}>
              <Button
                variant={location === item.href ? "default" : "ghost"}
                size="sm"
                className="gap-1"
              >
                <item.icon className="h-4 w-4" />
                {item.label}
                {item.href === '/subscription' && !isPremium && (
                  <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                    Upgrade
                  </span>
                )}
              </Button>
            </Link>
          ))}
          
          <div className="ml-2 pl-2 border-l">
            <Avatar className="h-8 w-8">
              <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
            </Avatar>
          </div>
        </nav>
        
        {/* Mobile navigation */}
        <Sheet open={isMenuOpen} onOpenChange={setIsMenuOpen}>
          <SheetTrigger asChild className="md:hidden">
            <Button variant="ghost" size="icon">
              <MenuIcon className="h-5 w-5" />
            </Button>
          </SheetTrigger>
          <SheetContent side="right" className="w-[250px] sm:w-[300px]">
            <div className="flex flex-col gap-4 py-4">
              <div className="flex items-center gap-2">
                <Avatar className="h-10 w-10">
                  <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-sm font-medium">{user.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {isPremium ? 'Premium Subscription' : 'Free Plan'}
                  </p>
                </div>
              </div>
              
              <nav className="flex flex-col gap-2">
                {navItems.map((item) => (
                  <Link 
                    key={item.href} 
                    href={item.href}
                    onClick={() => setIsMenuOpen(false)}
                  >
                    <Button
                      variant={location === item.href ? "default" : "ghost"}
                      className="w-full justify-start gap-2"
                    >
                      <item.icon className="h-4 w-4" />
                      {item.label}
                      {item.href === '/subscription' && !isPremium && (
                        <span className="ml-1 text-xs bg-primary/20 text-primary px-1.5 py-0.5 rounded-full">
                          Upgrade
                        </span>
                      )}
                    </Button>
                  </Link>
                ))}
              </nav>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}