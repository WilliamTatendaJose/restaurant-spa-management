import { NextRequest, NextResponse } from 'next/server';

export async function GET() {
  try {
    // Check database connectivity
    const dbHealthy = await checkDatabaseHealth();

    // Check external service availability
    const servicesHealth = await checkExternalServices();

    // Calculate overall health score
    const healthScore = calculateHealthScore(dbHealthy, servicesHealth);

    return NextResponse.json({
      status:
        healthScore > 0.8
          ? 'healthy'
          : healthScore > 0.5
            ? 'degraded'
            : 'unhealthy',
      score: healthScore,
      timestamp: new Date().toISOString(),
      checks: {
        database: dbHealthy,
        services: servicesHealth,
      },
    });
  } catch (error) {
    return NextResponse.json(
      {
        status: 'unhealthy',
        score: 0,
        timestamp: new Date().toISOString(),
        error: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

export async function HEAD() {
  return new NextResponse(null, { status: 200 });
}

async function checkDatabaseHealth() {
  try {
    // Simple query to test database connectivity
    const start = Date.now();
    const response = await fetch(
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1/`,
      {
        headers: {
          apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
          Authorization: `Bearer ${process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY}`,
        },
      }
    );

    const latency = Date.now() - start;

    return {
      status: response.ok ? 'healthy' : 'unhealthy',
      latency,
      responsive: latency < 1000,
    };
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: -1,
      responsive: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

async function checkExternalServices() {
  const services = [];

  // Check ZIMRA API if configured
  if (process.env.ZIMRA_API_URL) {
    try {
      const start = Date.now();
      const response = await fetch(`${process.env.ZIMRA_API_URL}/health`, {
        timeout: 5000,
      } as any);

      services.push({
        name: 'ZIMRA',
        status: response.ok ? 'healthy' : 'unhealthy',
        latency: Date.now() - start,
      });
    } catch (error) {
      services.push({
        name: 'ZIMRA',
        status: 'unhealthy',
        latency: -1,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  }

  return services;
}

function calculateHealthScore(dbHealth: any, servicesHealth: any[]) {
  let score = 0;
  let totalWeight = 0;

  // Database health (70% weight)
  const dbWeight = 0.7;
  if (dbHealth.status === 'healthy' && dbHealth.responsive) {
    score += dbWeight;
  } else if (dbHealth.status === 'healthy') {
    score += dbWeight * 0.5;
  }
  totalWeight += dbWeight;

  // External services health (30% weight)
  const servicesWeight = 0.3;
  if (servicesHealth.length > 0) {
    const healthyServices = servicesHealth.filter(
      (s) => s.status === 'healthy'
    ).length;
    score += servicesWeight * (healthyServices / servicesHealth.length);
  } else {
    score += servicesWeight; // No external services means full score for this section
  }
  totalWeight += servicesWeight;

  return score / totalWeight;
}
