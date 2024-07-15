
import * as Sentry from '@sentry/node';

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