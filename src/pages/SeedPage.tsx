import React from 'react';
import { SeedPackages } from '../components/SeedPackages';

const SeedPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-accent/20 to-primary/5 p-8">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">
            Development Tools
          </h1>
          <p className="text-muted-foreground">
            Tools for seeding and managing development data
          </p>
        </div>
        
        <SeedPackages />
      </div>
    </div>
  );
};

export default SeedPage;
