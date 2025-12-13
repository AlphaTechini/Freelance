<script>
  import PriceDisplay from './PriceDisplay.svelte';
  
  let {
    gig,
    onclick = () => {}
  } = $props();
  
  const defaultImage = 'https://via.placeholder.com/400x300?text=No+Image';
  const gigImage = gig.images && gig.images.length > 0 ? gig.images[0] : defaultImage;
</script>

<div 
  class="bg-white dark:bg-gray-800 rounded-lg shadow hover:shadow-lg transition-all duration-200 cursor-pointer overflow-hidden hover:-translate-y-1"
  onclick={onclick}
  role="button"
  tabindex="0"
  onkeydown={(e) => e.key === 'Enter' && onclick()}
>
  <div class="relative h-48 overflow-hidden">
    <img 
      src={gigImage} 
      alt={gig.title}
      class="w-full h-full object-cover"
    />
  </div>
  
  <div class="p-4">
    <div class="flex items-center gap-2 mb-2">
      {#if gig.ownerId?.profileImage}
        <img 
          src={gig.ownerId.profileImage} 
          alt={gig.ownerId.displayName}
          class="w-8 h-8 rounded-full"
        />
      {:else}
        <div class="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-semibold">
          {gig.ownerId?.displayName?.charAt(0) || 'U'}
        </div>
      {/if}
      <span class="text-sm text-gray-600 dark:text-gray-400">
        {gig.ownerId?.displayName || 'Unknown'}
      </span>
    </div>
    
    <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2 line-clamp-2">
      {gig.title}
    </h3>
    
    <div class="flex items-center gap-2 mb-3">
      {#if gig.stats?.rating > 0}
        <div class="flex items-center">
          <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
            <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
          </svg>
          <span class="ml-1 text-sm font-medium text-gray-700 dark:text-gray-300">
            {gig.stats.rating.toFixed(1)}
          </span>
        </div>
        <span class="text-sm text-gray-500 dark:text-gray-400">
          ({gig.stats.totalReviews})
        </span>
      {/if}
    </div>
    
    <div class="flex items-center justify-between">
      <div>
        <span class="text-sm text-gray-500 dark:text-gray-400">Starting at</span>
        <PriceDisplay 
          amount={gig.pricing.basePrice} 
          currency={gig.pricing.currency}
          class="text-lg"
        />
      </div>
      
      {#if gig.stats?.orders > 0}
        <div class="text-sm text-gray-500 dark:text-gray-400">
          {gig.stats.orders} orders
        </div>
      {/if}
    </div>
  </div>
</div>

<style>
  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>
