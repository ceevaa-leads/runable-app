import React from 'react';
import { Sparkles, Clock, Bell } from 'lucide-react';

interface ComingSoonPageProps {
  title: string;
  description?: string;
  icon?: React.ReactNode;
}

export const ComingSoonPage: React.FC<ComingSoonPageProps> = ({ 
  title, 
  description,
  icon 
}) => {
  return (
    <div className="coming-soon-page">
      <div className="coming-soon-card">
        {/* Animated background elements */}
        <div className="coming-soon-bg-elements">
          <div className="bg-circle circle-1" />
          <div className="bg-circle circle-2" />
          <div className="bg-circle circle-3" />
        </div>

        {/* Icon */}
        <div className="coming-soon-icon">
          {icon || <Sparkles size={48} />}
        </div>

        {/* Content */}
        <div className="coming-soon-content">
          <h1 className="coming-soon-title">{title}</h1>
          <div className="coming-soon-badge">
            <Clock size={14} />
            <span>Coming Soon</span>
          </div>
          <p className="coming-soon-description">
            {description || "We're working hard to bring you something amazing. This feature will be available soon!"}
          </p>
        </div>

        {/* Features preview */}
        <div className="coming-soon-features">
          <div className="feature-pill">
            <Bell size={14} />
            <span>Get notified when it's ready</span>
          </div>
        </div>

        {/* Progress indicator */}
        <div className="coming-soon-progress">
          <div className="progress-label">
            <span>In Development</span>
            <span className="progress-dots">
              <span className="dot active" />
              <span className="dot active" />
              <span className="dot" />
              <span className="dot" />
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};


