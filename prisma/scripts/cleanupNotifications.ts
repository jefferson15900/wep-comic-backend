// backend/prisma/scripts/cleanupNotifications.ts

import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  // Define la antigüedad de las notificaciones a borrar (ej. 90 días)
  const DELETION_THRESHOLD_DAYS = 90;

  const thresholdDate = new Date();
  thresholdDate.setDate(thresholdDate.getDate() - DELETION_THRESHOLD_DAYS);

  console.log(`Iniciando limpieza: Borrando notificaciones más antiguas de ${thresholdDate.toISOString()}...`);

  // Usa deleteMany para borrar eficientemente todos los registros que cumplen la condición
  const { count } = await prisma.notification.deleteMany({
    where: {
      createdAt: {
        lt: thresholdDate // lt = "less than" (más antiguo que)
      }
    }
  });

  console.log(`✅ Limpieza completada. Se borraron ${count} notificaciones antiguas.`);
}

// Ejecuta la función principal y maneja los errores
main()
  .catch(e => {
    console.error("❌ Error durante la limpieza de notificaciones:", e);
    process.exit(1);
  })
  .finally(async () => {
    // Asegúrate de desconectar el cliente de Prisma
    await prisma.$disconnect();
  });