import webpush from 'web-push';
import { IPushSubscription, PushSubscriptionModel } from '../../models/PushSubscription';

export const registerPushSubscription = async (
  userId: string,
  subscription: any,
) => {
  if (!subscription?.endpoint || !subscription?.keys?.p256dh || !subscription?.keys?.auth) {
    return { status: 400, body: { message: 'Subscription inválida' } };
  }

  await PushSubscriptionModel.updateOne(
    { endpoint: subscription.endpoint },
    {
      userId,
      endpoint: subscription.endpoint,
      keys: {
        p256dh: subscription.keys.p256dh,
        auth: subscription.keys.auth,
      },
    },
    { upsert: true },
  );

  return { status: 201, body: { message: 'Subscription registrada.' } };
};

export async function sendPushToDriver(
  driverId: string,
  payload: { title: string; body: string; data?: unknown },
) {
  const subs = await PushSubscriptionModel.find({ userId: driverId });

  await Promise.all(
    subs.map(async (sub: IPushSubscription) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.keys.p256dh,
              auth: sub.keys.auth,
            },
          } as any,
          JSON.stringify({
            title: payload.title,
            body: payload.body,
            data: payload.data,
          }),
        );
      } catch (err: any) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await PushSubscriptionModel.deleteOne({ _id: sub._id });
        } else {
          console.error('Falha push:', err.statusCode, err.body);
        }
      }
    }),
  );
}
