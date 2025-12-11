<script>
  import { onMount } from 'svelte';
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiService } from '$lib/services/api.js';
  import { authStore } from '$lib/stores/auth.js';
  
  let gig = $state(null);
  let loading = $state(true);
  let error = $state('');
  let selectedPackage = $state('basic');
  
  const gigId = $derived($page.params.id);
  
  onMount(() => {
    loadGig();
  });
  
  async function loadGig() {
    loading = true;
    error = '';
    
    try {
      const response = await apiService.getGigById(gigId, true);
      
      if (response.success) {
        gig = response.gig;
        
        // Set default package to the first available one
        if (gig.pricing.packages.basic) {
          selectedPackage = 'basic';
        } else if (gig.pricing.packages.standard) {
          selectedPackage = 'standard';
        } else if (gig.pricing.packages.premium) {
          selectedPackage = 'premium';
        }
      } else {
        error = response.error || 'Failed to load gig';
      }
    } catch (err) {
      error = err.message || 'Failed to load gig';
    } finally {
      loading = false;
    }
  }
  
  function handleOrder() {
    if (!$authStore.user) {
      goto('/auth/login');
      return;
    }
    
    // Navigate to order creation (will be implemented in order management task)
    goto(`/orders/create?gigId=${gigId}&package=${selectedPackage}`);
  }
  
  function handleEdit() {
    goto(`/gigs/${gigId}/edit`);
  }
  
  const isOwner = $derived(gig && $authStore.user && gig.ownerId._id === $authStore.user.uid);
</script>

<svelte:head>
  <title>{gig ? gig.title : 'Loading...'} - CryptoGigs</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading gig...</p>
    </div>
  {:else if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {error}
    </div>
    <Button onclick={() => goto('/gigs')}>Back to Gigs</Button>
  {:else if gig}
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-8">
      <!-- Main Content -->
      <div class="lg:col-span-2">
        <!-- Images -->
        {#if gig.images && gig.images.length > 0}
          <div class="mb-6">
            <img 
              src={gig.images[0]} 
              alt={gig.title}
              class="w-full h-96 object-cover rounded-lg"
            />
            {#if gig.images.length > 1}
              <div class="grid grid-cols-4 gap-2 mt-2">
                {#each gig.images.slice(1, 5) as image}
                  <img 
                    src={image} 
                    alt={gig.title}
                    class="w-full h-24 object-cover rounded-lg cursor-pointer hover:opacity-80"
                  />
                {/each}
              </div>
            {/if}
          </div>
        {/if}
        
        <!-- Title and Category -->
        <div class="mb-6">
          <div class="flex items-center gap-2 mb-2">
            <span class="px-3 py-1 bg-orange-100 dark:bg-orange-900 text-orange-600 dark:text-orange-300 rounded-full text-sm">
              {gig.category}
            </span>
            {#if gig.subcategory}
              <span class="text-gray-500 dark:text-gray-400 text-sm">
                / {gig.subcategory}
              </span>
            {/if}
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-4">
            {gig.title}
          </h1>
          
          <!-- Stats -->
          <div class="flex items-center gap-4 text-sm">
            {#if gig.stats.rating > 0}
              <div class="flex items-center">
                <svg class="w-5 h-5 text-yellow-400 fill-current" viewBox="0 0 20 20">
                  <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                </svg>
                <span class="ml-1 font-medium text-gray-700 dark:text-gray-300">
                  {gig.stats.rating.toFixed(1)}
                </span>
                <span class="ml-1 text-gray-500 dark:text-gray-400">
                  ({gig.stats.totalReviews} reviews)
                </span>
              </div>
            {/if}
            {#if gig.stats.orders > 0}
              <span class="text-gray-500 dark:text-gray-400">
                {gig.stats.orders} orders
              </span>
            {/if}
            <span class="text-gray-500 dark:text-gray-400">
              {gig.stats.views} views
            </span>
          </div>
        </div>
        
        <!-- Description -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">About This Gig</h2>
          <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
            {gig.description}
          </p>
        </div>
        
        <!-- Tags -->
        {#if gig.tags && gig.tags.length > 0}
          <div class="mb-6">
            <h3 class="text-lg font-semibold mb-3 text-gray-900 dark:text-white">Tags</h3>
            <div class="flex flex-wrap gap-2">
              {#each gig.tags as tag}
                <span class="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-full text-sm">
                  #{tag}
                </span>
              {/each}
            </div>
          </div>
        {/if}
        
        <!-- Requirements -->
        {#if gig.requirements}
          <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
            <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Requirements</h2>
            <p class="text-gray-700 dark:text-gray-300 whitespace-pre-wrap">
              {gig.requirements}
            </p>
          </div>
        {/if}
      </div>
      
      <!-- Sidebar -->
      <div class="lg:col-span-1">
        <!-- Seller Info -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-6">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">About the Seller</h3>
          <div class="flex items-center gap-3 mb-4">
            {#if gig.ownerId.profileImage}
              <img 
                src={gig.ownerId.profileImage} 
                alt={gig.ownerId.displayName}
                class="w-16 h-16 rounded-full"
              />
            {:else}
              <div class="w-16 h-16 rounded-full bg-orange-500 flex items-center justify-center text-white text-2xl font-semibold">
                {gig.ownerId.displayName.charAt(0)}
              </div>
            {/if}
            <div>
              <h4 class="font-semibold text-gray-900 dark:text-white">
                {gig.ownerId.displayName}
              </h4>
              {#if gig.ownerId.rating > 0}
                <div class="flex items-center text-sm">
                  <svg class="w-4 h-4 text-yellow-400 fill-current" viewBox="0 0 20 20">
                    <path d="M10 15l-5.878 3.09 1.123-6.545L.489 6.91l6.572-.955L10 0l2.939 5.955 6.572.955-4.756 4.635 1.123 6.545z"/>
                  </svg>
                  <span class="ml-1 text-gray-700 dark:text-gray-300">
                    {gig.ownerId.rating.toFixed(1)}
                  </span>
                </div>
              {/if}
            </div>
          </div>
          {#if gig.ownerId.bio}
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              {gig.ownerId.bio}
            </p>
          {/if}
          {#if gig.ownerId.skills && gig.ownerId.skills.length > 0}
            <div class="flex flex-wrap gap-2">
              {#each gig.ownerId.skills.slice(0, 5) as skill}
                <span class="px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded text-xs">
                  {skill}
                </span>
              {/each}
            </div>
          {/if}
        </div>
        
        <!-- Packages -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow sticky top-4">
          <h3 class="text-lg font-semibold mb-4 text-gray-900 dark:text-white">Select Package</h3>
          
          <div class="space-y-2 mb-6">
            {#if gig.pricing.packages.basic}
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer {selectedPackage === 'basic' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600'}">
                <input 
                  type="radio" 
                  bind:group={selectedPackage} 
                  value="basic"
                  class="mr-3"
                />
                <div class="flex-1">
                  <div class="font-semibold text-gray-900 dark:text-white">Basic</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {gig.pricing.packages.basic.description}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {gig.pricing.packages.basic.deliveryDays} days delivery • {gig.pricing.packages.basic.revisions} revisions
                  </div>
                </div>
                <div class="text-lg font-bold text-orange-500">
                  {gig.pricing.packages.basic.price} {gig.pricing.currency}
                </div>
              </label>
            {/if}
            
            {#if gig.pricing.packages.standard}
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer {selectedPackage === 'standard' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600'}">
                <input 
                  type="radio" 
                  bind:group={selectedPackage} 
                  value="standard"
                  class="mr-3"
                />
                <div class="flex-1">
                  <div class="font-semibold text-gray-900 dark:text-white">Standard</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {gig.pricing.packages.standard.description}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {gig.pricing.packages.standard.deliveryDays} days delivery • {gig.pricing.packages.standard.revisions} revisions
                  </div>
                </div>
                <div class="text-lg font-bold text-orange-500">
                  {gig.pricing.packages.standard.price} {gig.pricing.currency}
                </div>
              </label>
            {/if}
            
            {#if gig.pricing.packages.premium}
              <label class="flex items-center p-3 border-2 rounded-lg cursor-pointer {selectedPackage === 'premium' ? 'border-orange-500 bg-orange-50 dark:bg-orange-900/20' : 'border-gray-300 dark:border-gray-600'}">
                <input 
                  type="radio" 
                  bind:group={selectedPackage} 
                  value="premium"
                  class="mr-3"
                />
                <div class="flex-1">
                  <div class="font-semibold text-gray-900 dark:text-white">Premium</div>
                  <div class="text-sm text-gray-600 dark:text-gray-400">
                    {gig.pricing.packages.premium.description}
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {gig.pricing.packages.premium.deliveryDays} days delivery • {gig.pricing.packages.premium.revisions} revisions
                  </div>
                </div>
                <div class="text-lg font-bold text-orange-500">
                  {gig.pricing.packages.premium.price} {gig.pricing.currency}
                </div>
              </label>
            {/if}
          </div>
          
          {#if isOwner}
            <Button variant="secondary" onclick={handleEdit} class="w-full">
              Edit Gig
            </Button>
          {:else}
            <Button onclick={handleOrder} class="w-full">
              Order Now
            </Button>
          {/if}
        </div>
      </div>
    </div>
  {/if}
</div>
