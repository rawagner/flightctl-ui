import { Button } from '@patternfly/react-core';
import React from 'react';

import './Channel.css';

export const Channel: React.FC<React.PropsWithChildren> = ({ children }) => {
  return <div className={'co-channel'}>{children}</div>;
};

type ChannelLineProps = {
  children?: React.ReactNode;
  start?: boolean;
  isLast?: boolean;
};

export const ChannelLine: React.FC<ChannelLineProps> = ({ children, start, isLast }) => {
  let className = 'co-channel-line';
  if (start) {
    className += ' co-channel-start';
  }
  if (isLast) {
    className += ' co-channel-line-last';
  }
  return <li className={className}>{children}</li>;
};

type ChannelNameProps = {
  children: React.ReactNode;
  current?: boolean;
};

export const ChannelName: React.FC<ChannelNameProps> = ({ children, current }) => {
  let className = 'co-channel-name';
  if (current) {
    className += ' co-channel-name--current';
  }
  return (
    <span className={className} data-test="cv-channel-name">
      {children}
    </span>
  );
};

type ChannelPathProps = {
  children: React.ReactNode;
  current?: boolean;
};

export const ChannelPath: React.FC<ChannelPathProps> = ({ children, current }) => {
  let className = 'co-channel-path';
  if (current) {
    className += ' co-channel-path--current';
  }
  return <ul className={className}>{children}</ul>;
};

type ChannelVersionProps = {
  children: React.ReactNode;
  current?: boolean;
};

export const ChannelVersion: React.FC<ChannelVersionProps> = ({ children, current }) => {
  let className = 'co-channel-version';
  if (current) {
    className += ' co-channel-version--current';
  }
  return <span className={className}>{children}</span>;
};

type ChannelVersionDotProps = {
  channel: string;
  current?: boolean;
  onClick: VoidFunction;
};

export const ChannelVersionDot: React.FC<ChannelVersionDotProps> = ({ current, onClick }) => {
  let className = 'co-channel-version-dot';
  if (current) {
    className += ' co-channel-version-dot--current';
  }
  return <Button variant="secondary" className={className} onClick={onClick} />;
};
