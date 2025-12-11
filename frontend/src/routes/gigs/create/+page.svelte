<script>
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import Button from '$lib/components/ui/Button.svelte';
  import Input from '$lib/components/ui/Input.svelte';
  import { apiService } from '$lib/services/api.js';
  import { authStore } from '$lib/stores/auth.js';
  
  let loading = $state(false);
  let error = $state('');
  let success = $state(false);
  
  // Form data
  let title = $state('');
  let description = $state('');
  let category = $state('');
  let subcategory = $state('');
  let tags = $state('');
  let requirements = $state('');
  let currency = $state('USDT');
  let basePrice = $state('');
  let deliveryTime = $state('');
  let revisions = $state('0');
  
  // Package data
  let hasBasic = $state(true);
  let basicPrice = $state('');
  let basicDescription = $state('');
  let basicDeliveryDays = $state('');
  let basicRevisions = $state('0');
  
  let hasStandard = $state(false);
  let standardPrice = $state('');
  let standardDescription = $state('');
  let standardDeliveryDays = $state('');
  let standardRevisions = $state('0');
  
  let hasPremium = $state(false);
  let premiumPrice = $state('');
  let premiumDescription = $state('');
  let premiumDeliveryDays = $state('');
  let premiumRevisions = $state('0');
  
  let imageUrls = $state('');
  let errors = $state({});
  
  const categories = [
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
  
  const currencies = ['USDT', 'ETH', 'BTC'];
  
  onMount(() => {
    if (!$authStore.user) {
      goto('/auth/login');
    }
  });
  
  function validateForm() {
    const newErrors = {};
    
    if (!title || title.length < 10 || title.length > 100) {
      newErrors.title = 'Title must be between 10 and 100 characters';
    }
    
    if (!description || description.length < 50 || description.length > 5000) {
      newErrors.description = 'Description must be between 50 and 5000 characters';
    }
    
    if (!category) {
      newErrors.category = 'Category is required';
    }
    
    if (!basePrice || parseFloat(basePrice) <= 0) {
      newErrors.basePrice = 'Base price must be greater than 0';
    }
    
    if (!deliveryTime || parseInt(deliveryTime) < 1 || parseInt(deliveryTime) > 365) {
      newErrors.deliveryTime = 'Delivery time must be between 1 and 365 days';
    }
    
    if (!hasBasic && !hasStandard && !hasPremium) {
      newErrors.packages = 'At least one package must be defined';
    }
    
    if (hasBasic) {
      if (!basicPrice || parseFloat(basicPrice) <= 0) {
        newErrors.basicPrice = 'Basic package price is required';
      }
      if (!basicDescription || basicDescription.length < 10) {
        newErrors.basicDescription = 'Basic package description must be at least 10 characters';
      }
      if (!basicDeliveryDays || parseInt(basicDeliveryDays) < 1) {
        newErrors.basicDeliveryDays = 'Basic package delivery days is required';
      }
    }
    
    if (hasStandard) {
      if (!standardPrice || parseFloat(standardPrice) <= 0) {
        newErrors.standardPrice = 'Standard package price is required';
      }
      if (!standardDescription || standardDescription.length < 10) {
        newErrors.standardDescription = 'Standard package description must be at least 10 characters';
      }
      if (!standardDeliveryDays || parseInt(standardDeliveryDays) < 1) {
        newErrors.standardDeliveryDays = 'Standard package delivery days is required';
      }
    }
    
    if (hasPremium) {
      if (!premiumPrice || parseFloat(premiumPrice) <= 0) {
        newErrors.premiumPrice = 'Premium package price is required';
      }
      if (!premiumDescription || premiumDescription.length < 10) {
        newErrors.premiumDescription = 'Premium package description must be at least 10 characters';
      }
      if (!premiumDeliveryDays || parseInt(premiumDeliveryDays) < 1) {
        newErrors.premiumDeliveryDays = 'Premium package delivery days is required';
      }
    }
    
    errors = newErrors;
    return Object.keys(newErrors).length === 0;
  }
  
  async function handleSubmit() {
    error = '';
    success = false;
    
    if (!validateForm()) {
      error = 'Please fix the errors in the form';
      return;
    }
    
    loading = true;
    
    try {
      const packages = {};
      
      if (hasBasic) {
        packages.basic = {
          price: parseFloat(basicPrice),
          description: basicDescription,
          deliveryDays: parseInt(basicDeliveryDays),
          revisions: parseInt(basicRevisions)
        };
      }
      
      if (hasStandard) {
        packages.standard = {
          price: parseFloat(standardPrice),
          description: standardDescription,
          deliveryDays: parseInt(standardDeliveryDays),
          revisions: parseInt(standardRevisions)
        };
      }
      
      if (hasPremium) {
        packages.premium = {
          price: parseFloat(premiumPrice),
          description: premiumDescription,
          deliveryDays: parseInt(premiumDeliveryDays),
          revisions: parseInt(premiumRevisions)
        };
      }
      
      const images = imageUrls
        .split('\n')
        .map(url => url.trim())
        .filter(url => url.length > 0);
      
      const tagArray = tags
        .split(',')
        .map(tag => tag.trim())
        .filter(tag => tag.length > 0);
      
      const gigData = {
        title,
        description,
        category,
        subcategory: subcategory || undefined,
        tags: tagArray.length > 0 ? tagArray : undefined,
        requirements: requirements || undefined,
        pricing: {
          basePrice: parseFloat(basePrice),
          currency,
          packages
        },
        deliveryTime: parseInt(deliveryTime),
        revisions: parseInt(revisions),
        images: images.length > 0 ? images : undefined
      };
      
      const response = await apiService.post('/gigs', gigData);
      
      if (response.success) {
        success = true;
        setTimeout(() => {
          goto(`/gigs/${response.gig._id}`);
        }, 1500);
      } else {
        error = response.error || 'Failed to create gig';
      }
    } catch (err) {
      error = err.message || 'Failed to create gig';
    } finally {
      loading = false;
    }
  }
</script>

<div class="container mx-auto px-4 py-8 max-w-4xl">
  <h1 class="text-3xl font-bold mb-8 text-gray-900 dark:text-white">Create New Gig</h1>
  
  {#if error}
    <div class="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-6">
      {error}
    </div>
  {/if}
  
  {#if success}
    <div class="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-6">
      Gig created successfully! Redirecting...
    </div>
  {/if}
  
  <form onsubmit={(e) => { e.preventDefault(); handleSubmit(); }} class="space-y-6">
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Basic Information</h2>
      
      <div class="space-y-4">
        <Input
          label="Gig Title"
          bind:value={title}
          placeholder="I will create a professional logo design"
          required
          error={errors.title}
        />
        
        <div>
          <label class="block mb-2 font-medium text-gray-900 dark:text-white">
            Description <span class="text-red-500">*</span>
          </label>
          <textarea
            bind:value={description}
            placeholder="Describe your service in detail..."
            rows="6"
            required
            class="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
          ></textarea>
          {#if errors.description}
            <p class="mt-1 text-sm text-red-500">{errors.description}</p>
          {/if}
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label class="block mb-2 font-medium text-gray-900 dark:text-white">
              Category <span class="text-red-500">*</span>
            </label>
            <select
              bind:value={category}
              required
              class="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
            >
              <option value="">Select a category</option>
              {#each categories as cat}
                <option value={cat.value}>{cat.label}</option>
              {/each}
            </select>
            {#if errors.category}
              <p class="mt-1 text-sm text-red-500">{errors.category}</p>
            {/if}
          </div>
          
          <Input
            label="Subcategory (Optional)"
            bind:value={subcategory}
            placeholder="e.g., Logo Design"
          />
        </div>
        
        <Input
          label="Tags (comma-separated)"
          bind:value={tags}
          placeholder="logo, design, branding"
        />
        
        <div>
          <label class="block mb-2 font-medium text-gray-900 dark:text-white">
            Image URLs (one per line)
          </label>
          <textarea
            bind:value={imageUrls}
            placeholder="https://example.com/image1.jpg&#10;https://example.com/image2.jpg"
            rows="4"
            class="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
          ></textarea>
        </div>
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Pricing</h2>
      
      <div class="space-y-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Input
            label="Base Price"
            type="number"
            bind:value={basePrice}
            placeholder="50"
            required
            error={errors.basePrice}
          />
          
          <div>
            <label class="block mb-2 font-medium text-gray-900 dark:text-white">
              Currency <span class="text-red-500">*</span>
            </label>
            <select
              bind:value={currency}
              required
              class="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
            >
              {#each currencies as curr}
                <option value={curr}>{curr}</option>
              {/each}
            </select>
          </div>
          
          <Input
            label="Delivery Time (days)"
            type="number"
            bind:value={deliveryTime}
            placeholder="7"
            required
            error={errors.deliveryTime}
          />
        </div>
        
        <Input
          label="Number of Revisions"
          type="number"
          bind:value={revisions}
          placeholder="2"
        />
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Packages</h2>
      {#if errors.packages}
        <p class="mb-4 text-sm text-red-500">{errors.packages}</p>
      {/if}
      
      <div class="mb-6">
        <label class="flex items-center mb-3">
          <input type="checkbox" bind:checked={hasBasic} class="mr-2" />
          <span class="font-medium text-gray-900 dark:text-white">Basic Package</span>
        </label>
        
        {#if hasBasic}
          <div class="ml-6 space-y-3 border-l-2 border-orange-500 pl-4">
            <Input
              label="Price"
              type="number"
              bind:value={basicPrice}
              placeholder="50"
              error={errors.basicPrice}
            />
            <Input
              label="Description"
              bind:value={basicDescription}
              placeholder="Basic package includes..."
              error={errors.basicDescription}
            />
            <div class="grid grid-cols-2 gap-3">
              <Input
                label="Delivery Days"
                type="number"
                bind:value={basicDeliveryDays}
                placeholder="7"
                error={errors.basicDeliveryDays}
              />
              <Input
                label="Revisions"
                type="number"
                bind:value={basicRevisions}
                placeholder="2"
              />
            </div>
          </div>
        {/if}
      </div>
      
      <div class="mb-6">
        <label class="flex items-center mb-3">
          <input type="checkbox" bind:checked={hasStandard} class="mr-2" />
          <span class="font-medium text-gray-900 dark:text-white">Standard Package</span>
        </label>
        
        {#if hasStandard}
          <div class="ml-6 space-y-3 border-l-2 border-orange-500 pl-4">
            <Input
              label="Price"
              type="number"
              bind:value={standardPrice}
              placeholder="100"
              error={errors.standardPrice}
            />
            <Input
              label="Description"
              bind:value={standardDescription}
              placeholder="Standard package includes..."
              error={errors.standardDescription}
            />
            <div class="grid grid-cols-2 gap-3">
              <Input
                label="Delivery Days"
                type="number"
                bind:value={standardDeliveryDays}
                placeholder="5"
                error={errors.standardDeliveryDays}
              />
              <Input
                label="Revisions"
                type="number"
                bind:value={standardRevisions}
                placeholder="3"
              />
            </div>
          </div>
        {/if}
      </div>
      
      <div class="mb-6">
        <label class="flex items-center mb-3">
          <input type="checkbox" bind:checked={hasPremium} class="mr-2" />
          <span class="font-medium text-gray-900 dark:text-white">Premium Package</span>
        </label>
        
        {#if hasPremium}
          <div class="ml-6 space-y-3 border-l-2 border-orange-500 pl-4">
            <Input
              label="Price"
              type="number"
              bind:value={premiumPrice}
              placeholder="200"
              error={errors.premiumPrice}
            />
            <Input
              label="Description"
              bind:value={premiumDescription}
              placeholder="Premium package includes..."
              error={errors.premiumDescription}
            />
            <div class="grid grid-cols-2 gap-3">
              <Input
                label="Delivery Days"
                type="number"
                bind:value={premiumDeliveryDays}
                placeholder="3"
                error={errors.premiumDeliveryDays}
              />
              <Input
                label="Revisions"
                type="number"
                bind:value={premiumRevisions}
                placeholder="5"
              />
            </div>
          </div>
        {/if}
      </div>
    </div>
    
    <div class="bg-white dark:bg-gray-800 rounded-lg p-6 shadow">
      <h2 class="text-xl font-semibold mb-4 text-gray-900 dark:text-white">Requirements</h2>
      
      <div>
        <label class="block mb-2 font-medium text-gray-900 dark:text-white">
          What do you need from the buyer to get started?
        </label>
        <textarea
          bind:value={requirements}
          placeholder="Please provide your brand guidelines, preferred colors, etc..."
          rows="4"
          class="w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500"
        ></textarea>
      </div>
    </div>
    
    <div class="flex gap-4">
      <Button type="submit" {loading} disabled={loading}>
        {loading ? 'Creating...' : 'Create Gig'}
      </Button>
      <Button variant="ghost" onclick={() => goto('/gigs')}>
        Cancel
      </Button>
    </div>
  </form>
</div>
