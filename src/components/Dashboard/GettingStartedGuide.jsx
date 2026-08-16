import React, { useState } from 'react';
import { db } from '../../services/databaseService';
import { useAppContext } from '../../context/AppContext';
import { CheckCircle2, Circle, X, ArrowRight, Package, Users, ShoppingCart, BarChart3 } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const GettingStartedGuide = () => {
  const { currentUser, refreshUserProfile } = useAppContext();
  const [isDismissing, setIsDismissing] = useState(false);

  // If they aren't a Newbie or don't exist, don't render.
  if (currentUser?.appKnowledge !== 'Newbie') return null;

  const handleDismiss = async () => {
    setIsDismissing(true);
    try {
      await db.update('users', currentUser.id, {
        appKnowledge: 'Rookie' // Upgrade them out of Newbie status
      });
      await refreshUserProfile();
    } catch (error) {
      console.error("Failed to dismiss guide:", error);
    }
    setIsDismissing(false);
  };

  const steps = [
    {
      id: 'products',
      title: 'Add your first product',
      description: 'Go to the Inventory page to add items you sell.',
      icon: <Package size={18} className="text-[var(--accent-color)]" />,
      link: '/inventory'
    },
    {
      id: 'customers',
      title: 'Add a customer',
      description: 'Keep track of who buys from you in the Customers section.',
      icon: <Users size={18} className="text-[var(--accent-color)]" />,
      link: '/customers'
    },
    {
      id: 'sales',
      title: 'Record a sale',
      description: 'Use the POS or Sales page to ring up an order.',
      icon: <ShoppingCart size={18} className="text-[var(--accent-color)]" />,
      link: '/pos'
    },
    {
      id: 'reports',
      title: 'View your reports',
      description: 'Check back here on the Dashboard to see your profit grow.',
      icon: <BarChart3 size={18} className="text-[var(--accent-color)]" />,
      link: '/dashboard'
    }
  ];

  return (
    <div className="bg-[var(--bg-card)] border border-[var(--border-color)] rounded-2xl p-6 mb-8 shadow-sm relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-color)] opacity-[0.03] rounded-full blur-3xl -translate-y-1/2 translate-x-1/3"></div>
      
      <div className="flex justify-between items-start mb-6 relative z-10">
        <div>
          <h2 className="text-xl font-bold text-text-main flex items-center gap-2">
            Welcome to Karobaar! Let's get you set up. 🚀
          </h2>
          <p className="text-text-secondary mt-1 text-sm max-w-2xl">
            We noticed you're new to business management apps. Don't worry, we've designed Karobaar to be as simple as possible. Follow these steps to learn the ropes.
          </p>
        </div>
        <button 
          onClick={handleDismiss} 
          disabled={isDismissing}
          className="text-text-muted hover:text-text-main transition-colors p-2 rounded-full hover:bg-[var(--bg-hover)]"
          title="Dismiss Guide"
        >
          <X size={20} />
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 relative z-10">
        {steps.map((step, index) => (
          <Link to={step.link} key={step.id} className="block group">
            <div className="h-full border border-[var(--border-color)] bg-[var(--bg-body)] rounded-xl p-4 transition-all hover:border-[var(--accent-color)] hover:shadow-md cursor-pointer flex flex-col">
              <div className="flex justify-between items-start mb-3">
                <div className="p-2.5 bg-[var(--bg-card)] border border-[var(--border-color)] rounded-lg shadow-sm">
                  {step.icon}
                </div>
                <div className="w-6 h-6 rounded-full bg-[var(--bg-card)] border border-[var(--border-color)] flex items-center justify-center text-xs font-bold text-text-muted">
                  {index + 1}
                </div>
              </div>
              <h3 className="font-semibold text-text-main mb-1.5 group-hover:text-[var(--accent-color)] transition-colors">{step.title}</h3>
              <p className="text-xs text-text-secondary leading-relaxed flex-grow">{step.description}</p>
              
              <div className="mt-4 pt-3 border-t border-[var(--border-color)] flex items-center justify-between text-xs font-medium text-text-muted group-hover:text-[var(--accent-color)] transition-colors">
                <span>Get started</span>
                <ArrowRight size={14} className="transform group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          </Link>
        ))}
      </div>
    </div>
  );
};
