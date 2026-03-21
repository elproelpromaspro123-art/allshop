import { describe, it, expect, vi } from 'vitest';
import { logger } from '@/lib/logger';

describe('Logger - Centralizado', () => {
  it('logger instance exists', () => {
    expect(logger).toBeDefined();
  });

  it('has debug method', () => {
    expect(typeof logger.debug).toBe('function');
  });

  it('has info method', () => {
    expect(typeof logger.info).toBe('function');
  });

  it('has warn method', () => {
    expect(typeof logger.warn).toBe('function');
  });

  it('has error method', () => {
    expect(typeof logger.error).toBe('function');
  });

  it('has critical method', () => {
    expect(typeof logger.critical).toBe('function');
  });

  it('has checkoutEvent method', () => {
    expect(typeof logger.checkoutEvent).toBe('function');
  });

  it('has securityEvent method', () => {
    expect(typeof logger.securityEvent).toBe('function');
  });

  it('has performanceMetric method', () => {
    expect(typeof logger.performanceMetric).toBe('function');
  });

  it('debug call does not throw', () => {
    expect(() => logger.debug('Test message')).not.toThrow();
  });

  it('info call does not throw', () => {
    expect(() => logger.info('Test message')).not.toThrow();
  });

  it('warn call does not throw', () => {
    expect(() => logger.warn('Test message')).not.toThrow();
  });
});
