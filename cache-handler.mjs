
import * as Sentry from '@sentry/node';

Sentry.init({
  dsn: "https://45dfb13194725e2c70fdd32a18056187@o4506956365430784.ingest.us.sentry.io/4507606231941120",

  // Adjust this value in production, or use tracesSampler for greater control
  tracesSampleRate: 1,

  // Setting this option to true will print useful information to the console while you're setting up Sentry.
  debug: true,
});

const cache = new Map()
 
export default class CacheHandler {
  constructor(options) {
    this.options = options
  }

  async get(key) {
    // This could be stored anywhere, like durable storage
    const item = cache.get(key);
    const hit = !!item;
    await Sentry.startSpan({
      name: `cache_transaction`,
    },  async () => {
      await Sentry.startSpan(
        {
          name: 'next-js-cache-lookup',
          op: 'cache.get_item',
        },
        async (span) => {
          console.info(key, hit, item?.value?.body?.length);
          if (span) {
            span.setAttribute('cache.hit', hit);
          }
          if (item && item?.value?.body) {
            span.setAttribute('cache.item_size', item.value.body.length);
          }
      });
    });
    return item
  }
 
  async set(key, data, ctx) {
    // This could be stored anywhere, like durable storage
    console.info(key, ctx)
    cache.set(key, {
      value: data,
      lastModified: Date.now(),
      tags: ctx.tags,
    })
  }
 
  async revalidateTag(tag) {
    console.info(tag);
    // Iterate over all entries in the cache
    for (let [key, value] of cache) {
      // If the value's tags include the specified tag, delete this entry
      if (value.tags.includes(tag)) {
        cache.delete(key)
      }
    }
  }
}