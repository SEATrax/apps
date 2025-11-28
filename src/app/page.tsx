'use client';

import Link from 'next/link';
import { 
  Ship, 
  FileText, 
  Coins, 
  Users, 
  TrendingUp, 
  Shield, 
  Zap,
  ArrowRight,
  CheckCircle,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { usePanna } from '@/hooks/usePanna';
import { appConfig } from '@/config';

export default function HomePage() {
  const { connect, isConnecting, isConnected } = usePanna();

  const features = [
    {
      icon: FileText,
      title: 'Invoice NFTs',
      description: 'Transform shipping invoices into tradeable ERC-721 tokens with full transparency on-chain.',
    },
    {
      icon: Coins,
      title: 'Investment Pools',
      description: 'Curated bundles of invoices for diversified investment with managed risk profiles.',
    },
    {
      icon: TrendingUp,
      title: '4% Investor Yield',
      description: 'Earn competitive returns by funding verified export invoices from trusted exporters.',
    },
    {
      icon: Shield,
      title: '70% Funding Threshold',
      description: 'Exporters can access funds early once invoices reach 70% funding completion.',
    },
    {
      icon: Users,
      title: 'Role-Based Access',
      description: 'Secure platform with Admin, Exporter, and Investor roles for proper governance.',
    },
    {
      icon: Zap,
      title: 'Fast Settlement',
      description: 'Blockchain-powered instant settlement and transparent profit distribution.',
    },
  ];

  const stats = [
    { label: 'Total Value Locked', value: '$2.4M', change: '+12%' },
    { label: 'Active Invoices', value: '156', change: '+8%' },
    { label: 'Investors', value: '432', change: '+23%' },
    { label: 'Avg. Return', value: '4.2%', change: '+0.2%' },
  ];

  const steps = [
    { 
      role: 'Exporter',
      title: 'Submit Invoice',
      description: 'Upload shipping invoice details and documents to create an Invoice NFT.',
    },
    { 
      role: 'Admin',
      title: 'Verify & Approve',
      description: 'Admin reviews and approves invoices, adding them to investment pools.',
    },
    { 
      role: 'Investor',
      title: 'Fund & Earn',
      description: 'Investors fund pools and earn 4% yield when invoices are repaid.',
    },
    { 
      role: 'Exporter',
      title: 'Withdraw & Repay',
      description: 'At 70% funding, exporters withdraw funds and repay upon invoice settlement.',
    },
  ];

  return (
    <div className="flex flex-col">
      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <Badge variant="secondary" className="mb-4">
              Built on Lisk Blockchain
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight mb-6">
              Unlock Working Capital from{' '}
              <span className="gradient-text">Shipping Invoices</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground mb-8 max-w-2xl mx-auto">
              {appConfig.description}. Connect exporters with investors through 
              blockchain-powered invoice financing with transparent yields and secure settlements.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              {isConnected ? (
                <>
                  <Button asChild size="lg" className="gap-2">
                    <Link href="/invoices">
                      View Invoices
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="/pools">
                      Explore Pools
                    </Link>
                  </Button>
                </>
              ) : (
                <>
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={connect}
                    isLoading={isConnecting}
                  >
                    Get Started
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                  <Button asChild variant="outline" size="lg">
                    <Link href="#how-it-works">
                      Learn More
                    </Link>
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-12 border-y bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-3xl sm:text-4xl font-bold">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
                <Badge variant="success" className="mt-2 text-xs">
                  {stat.change}
                </Badge>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Why Choose {appConfig.name}?
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A comprehensive platform designed for modern trade finance with 
              blockchain security and transparency.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature) => (
              <Card key={feature.title} className="card-hover">
                <CardHeader>
                  <div className="h-12 w-12 rounded-lg bg-primary/10 flex items-center justify-center mb-4">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <CardTitle className="text-xl">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-base">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-20 bg-muted/30">
        <div className="container mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              How It Works
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              A simple four-step process connecting exporters with global investors.
            </p>
          </div>
          
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {steps.map((step, index) => (
              <div key={step.title} className="relative">
                <Card className="h-full">
                  <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                      <span className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-primary-foreground text-sm font-bold">
                        {index + 1}
                      </span>
                      <Badge variant="outline">{step.role}</Badge>
                    </div>
                    <CardTitle className="text-lg">{step.title}</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <CardDescription>{step.description}</CardDescription>
                  </CardContent>
                </Card>
                
                {/* Connector arrow (hidden on mobile and last item) */}
                {index < steps.length - 1 && (
                  <div className="hidden lg:block absolute top-1/2 -right-3 transform -translate-y-1/2">
                    <ArrowRight className="h-6 w-6 text-muted-foreground/50" />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="container mx-auto px-4">
          <Card className="bg-gradient-to-br from-primary/10 to-blue-500/10 border-primary/20">
            <CardContent className="py-12 text-center">
              <Ship className="h-16 w-16 mx-auto text-primary mb-6" />
              <h2 className="text-3xl sm:text-4xl font-bold mb-4">
                Ready to Get Started?
              </h2>
              <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
                Join hundreds of exporters and investors already using {appConfig.name} 
                to streamline trade finance with blockchain technology.
              </p>
              
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                {!isConnected && (
                  <Button 
                    size="lg" 
                    className="gap-2"
                    onClick={connect}
                    isLoading={isConnecting}
                  >
                    Connect Wallet
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                )}
                <Button asChild variant="outline" size="lg">
                  <Link href="/docs">
                    Read Documentation
                  </Link>
                </Button>
              </div>
              
              <div className="flex items-center justify-center gap-6 mt-8 text-sm text-muted-foreground">
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  No hidden fees
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  Instant settlement
                </span>
                <span className="flex items-center gap-2">
                  <CheckCircle className="h-4 w-4 text-emerald-500" />
                  24/7 Support
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </section>
    </div>
  );
}
