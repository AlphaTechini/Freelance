<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import GigCard from '$lib/components/GigCard.svelte';
  import Button from '$lib/components/ui/Button.svelte';
  import { apiService } from '$lib/services/api.js';
  
  let gigs = $state([]);
  let loading = $state(true);
  let error = $state('');
  let pagination = $state({ page: 1, limit: 20, total: 0, pages: 0 });
  
  // Filters
  let selectedCategory = $state('');
  let selectedCurrency = $state('');
  let searchQuery = $state('');
  let sortBy = $state('createdAt');
  let sortOrder = $state(-1);
  
  const categories = [
    { value: '', label: 'All Categories' },
    { value: 'graphics-design', label: 'Graphics & Design' },
    { value: 'digital-marketing', label: 'Digital Marketing' },
    { value: 'writing-translation', label: 'Writing & Translation' },
    { value: 'video-animation', label: 'Video & Animation' },
    { value: 'music-audio', label: 'Music & Audio' },
    { value: 'programming-tech', label: 'Programming & Tech' },
    { value: 'business', label: 'Business' },
    { value: 'lifestyle', label: 'Lifestyle' },
    { value: 'data', label: 'Data' },
    { value: 'photography', label: 'Photography' }
  ];
  
  const currencies = [
    { value: '', label: 'All Currencies' },
    { value: 'USDT', label: 'USDT' },
    { value: 'ETH', label: 'ETH' },
    { value: 'BTC', label: 'BTC' }
  ];
  
  const sortOptions = [
    { value: 'createdAt:-1', label: 'Newest First' },
    { value: 'createdAt:1', label: 'Oldest First' },
    { value: 'pricing.basePrice:1', label: 'Price: Low to High' },
    { value: 'pricing.basePrice:-1', label: 'Price: High to Low' },
    { value: 'stats.rating:-1', label: 'Highest Rated' },
    { value: 'stats.orders:-1', label: 'Most Popular' }
  ];
  
  onMount(() => {
    loadGigs();
  });
  
  async function loadGigs() {
    loading = true;
    error = '';
    
    try {
      const filters = {
        page: pagination.page,
        limit: pagination.limit,
        sortBy,
        sortOrder
      };
      
      if (selectedCategory) filters.category = selectedCategory;
      if (selectedCurrency) filters.currency = selectedCurrency;
      if (searchQuery) filters.search = searchQuery;
      
      const response = await apiService.getGigs(filters);
      
      if (response.success) {
        gigs = response.gigs;
        pagination = response.pagination;
      } else {
        error = response.error || 'Failed to load gigs';
      }
    } catch (err) {
      error = err.message || 'Failed to load gigs';
    } finally {
      loading = false;
    }
  }
  
  function handleSortChange(e) {
    const [field, order] = e.target.value.split(':');
    sortBy = field;
    sortOrder = parseInt(order);
    pagination.page = 1;
    loadGigs();
  }
  
  function handleCategoryChange() {
    pagination.page = 1;
    loadGigs();
  }
  
  function handleCurrencyChange() {
    pagination.page = 1;
    loadGigs();
  }
  
  function handleSearch() {
    pagination.page = 1;
    loadGigs();
  }
  
  function goToPage(page) {
    pagination.page = page;
    loadGigs();
  }
  
  function viewGig(gigId) {
    goto(`/gigs/${gigId}`);
  }
</script>

<svelte:head>
  <title>Browse Gigs - CryptoGigs</title>
</svelte:head>

<div class="container mx-auto px-4 py-8">
  <div class="flex justify-between items-center mb-8">
    <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Browse Gigs</h1>
    <Button onclick={() => goto('/gigs/create')}>
      Create Gig
    </Button>
  </div>
  
  <!-- Filters -->
  <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow mb-8">
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Search
        </label>
        <div class="flex gap-2">
          <input
            type="text"
            bind:value={searchQuery}
            placeholder="Search gigs..."
            class="flex-1 px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
            onkeydown={(e) => e.key === 'Enter' && handleSearch()}
          />
          <button
            onclick={handleSearch}
            class="px-4 py-2 bg-orange-500 text-white rounded-lg hover:bg-orange-600"
          >
            Search
          </button>
        </div>
      </div>
      
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Category
        </label>
        <select
          bind:value={selectedCategory}
          onchange={handleCategoryChange}
          class="w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
        >
          {#each categories as cat}
            <option value={cat.value}>{cat.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Currency
        </label>
        <select
          bind:value={selectedCurrency}
          onchange={handleCurrencyChange}
          class="w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
        >
          {#each currencies as curr}
            <option value={curr.value}>{curr.label}</option>
          {/each}
        </select>
      </div>
      
      <div>
        <label class="block mb-2 text-sm font-medium text-gray-900 dark:text-white">
          Sort By
        </label>
        <select
          value={`${sortBy}:${sortOrder}`}
          onchange={handleSortChange}
          class="w-full px-4 py-2 border-2 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
        >
          {#each sortOptions as option}
            <option value={option.value}>{option.label}</option>
          {/each}
        </select>
      </div>
    </div>
  </div>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {error}
    </div>
  {/if}
  
  {#if loading}
    <div class="text-center py-12">
      <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
      <p class="mt-4 text-gray-600 dark:text-gray-400">Loading gigs...</p>
    </div>
  {:else if gigs.length === 0}
    <div class="text-center py-12">
      <p class="text-gray-600 dark:text-gray-400">No gigs found. Try adjusting your filters.</p>
    </div>
  {:else}
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-8">
      {#each gigs as gig (gig._id)}
        <GigCard {gig} onclick={() => viewGig(gig._id)} />
      {/each}
    </div>
    
    <!-- Pagination -->
    {#if pagination.pages > 1}
      <div class="flex justify-center gap-2">
        <button
          onclick={() => goToPage(pagination.page - 1)}
          disabled={pagination.page === 1}
          class="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Previous
        </button>
        
        {#each Array(pagination.pages) as _, i}
          {#if i + 1 === pagination.page || i + 1 === 1 || i + 1 === pagination.pages || (i + 1 >= pagination.page - 1 && i + 1 <= pagination.page + 1)}
            <button
              onclick={() => goToPage(i + 1)}
              class="px-4 py-2 border rounded-lg {pagination.page === i + 1 ? 'bg-orange-500 text-white' : 'hover:bg-gray-100 dark:hover:bg-gray-700'}"
            >
              {i + 1}
            </button>
          {:else if i + 1 === pagination.page - 2 || i + 1 === pagination.page + 2}
            <span class="px-2 py-2">...</span>
          {/if}
        {/each}
        
        <button
          onclick={() => goToPage(pagination.page + 1)}
          disabled={pagination.page === pagination.pages}
          class="px-4 py-2 border rounded-lg disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-100 dark:hover:bg-gray-700"
        >
          Next
        </button>
      </div>
    {/if}
  {/if}
</div>
