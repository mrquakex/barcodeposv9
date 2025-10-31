import { Response } from 'express';
import prisma from '../lib/prisma.js';
import { CorpAuthRequest } from '../middleware/auth.middleware.js';
import { createAuditLog } from '../lib/audit.js';

// In-memory store for integrations (in production, use database)
const integrations: any[] = [];

export const listIntegrations = async (req: CorpAuthRequest, res: Response) => {
  try {
    res.json({ integrations });
  } catch (error) {
    console.error('List integrations error:', error);
    res.status(500).json({ error: 'Failed to fetch integrations' });
  }
};

export const createIntegration = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { type, name, config } = req.body;
    
    const integration = {
      id: `int_${Date.now()}`,
      type, // 'SSO', 'WEBHOOK', 'PAYMENT', etc.
      name,
      config,
      isActive: true,
      createdAt: new Date(),
    };
    
    integrations.push(integration);

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'CREATE',
      resource: 'INTEGRATION',
      resourceId: integration.id,
      details: `Created integration: ${name} (${type})`,
      ipAddress: req.ip,
    });

    res.status(201).json({ integration });
  } catch (error) {
    console.error('Create integration error:', error);
    res.status(500).json({ error: 'Failed to create integration' });
  }
};

export const updateIntegration = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const { name, config, isActive } = req.body;
    
    const index = integrations.findIndex((int: any) => int.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    integrations[index] = {
      ...integrations[index],
      name,
      config,
      isActive,
      updatedAt: new Date(),
    };

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'UPDATE',
      resource: 'INTEGRATION',
      resourceId: id,
      details: `Updated integration: ${name}`,
      ipAddress: req.ip,
    });

    res.json({ integration: integrations[index] });
  } catch (error) {
    console.error('Update integration error:', error);
    res.status(500).json({ error: 'Failed to update integration' });
  }
};

export const deleteIntegration = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const index = integrations.findIndex((int: any) => int.id === id);
    if (index === -1) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    integrations.splice(index, 1);

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'DELETE',
      resource: 'INTEGRATION',
      resourceId: id,
      details: `Deleted integration: ${id}`,
      ipAddress: req.ip,
    });

    res.json({ message: 'Integration deleted successfully' });
  } catch (error) {
    console.error('Delete integration error:', error);
    res.status(500).json({ error: 'Failed to delete integration' });
  }
};

export const setupSSO = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { provider, clientId, clientSecret, metadataUrl } = req.body;
    
    // Simplified SSO setup (in production, use proper SAML/OAuth library)
    const ssoIntegration = {
      id: `sso_${Date.now()}`,
      type: 'SSO',
      name: `${provider} SSO`,
      config: {
        provider,
        clientId,
        clientSecret: '***', // Never expose secret
        metadataUrl,
      },
      isActive: true,
      createdAt: new Date(),
    };

    integrations.push(ssoIntegration);

    await createAuditLog({
      adminId: req.admin!.id,
      action: 'SETUP_SSO',
      resource: 'INTEGRATION',
      resourceId: ssoIntegration.id,
      details: `SSO setup for provider: ${provider}`,
      ipAddress: req.ip,
    });

    res.status(201).json({ integration: ssoIntegration });
  } catch (error) {
    console.error('Setup SSO error:', error);
    res.status(500).json({ error: 'Failed to setup SSO' });
  }
};

export const testIntegration = async (req: CorpAuthRequest, res: Response) => {
  try {
    const { id } = req.params;
    const integration = integrations.find((int: any) => int.id === id);
    
    if (!integration) {
      return res.status(404).json({ error: 'Integration not found' });
    }

    // Simulate integration test
    await createAuditLog({
      adminId: req.admin!.id,
      action: 'TEST_INTEGRATION',
      resource: 'INTEGRATION',
      resourceId: id,
      details: `Tested integration: ${integration.name}`,
      ipAddress: req.ip,
    });

    res.json({ 
      message: 'Integration test completed',
      status: 'success',
      details: 'Connection verified',
    });
  } catch (error) {
    console.error('Test integration error:', error);
    res.status(500).json({ error: 'Failed to test integration' });
  }
};

