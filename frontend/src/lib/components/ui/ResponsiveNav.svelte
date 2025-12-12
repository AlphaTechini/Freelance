<script>
  import { createEventDispatcher } from 'svelte';
  
  let {
    items = [],
    activeItem = '',
    variant = 'horizontal',
    class: className = '',
    ...rest
  } = $props();

  const dispatch = createEventDispatcher();
  let mobileMenuOpen = $state(false);

  function toggleMobileMenu() {
    mobileMenuOpen = !mobileMenuOpen;
  }

  function handleItemClick(item) {
    dispatch('itemClick', item);
    mobileMenuOpen = false; // Close mobile menu on item click
  }

  function isActive(item) {
    return activeItem === item.id || activeItem === item.href;
  }
</script>

<nav class="responsive-nav {className}" {...rest}>
  <!-- Desktop Navigation -->
  <div class="hidden md:flex {variant === 'vertical' ? 'flex-col' : 'flex-row'} gap-4">
    {#each items as item}
      <button
        class="nav-item {isActive(item) ? 'nav-item-active' : ''}"
        onclick={() => handleItemClick(item)}
        aria-current={isActive(item) ? 'page' : undefined}
      >
        {#if item.icon}
          <span class="nav-icon">{@html item.icon}</span>
        {/if}
        <span>{item.label}</span>
      </button>
    {/each}
  </div>

  <!-- Mobile Navigation -->
  <div class="md:hidden">
    <!-- Mobile Menu Button -->
    <button
      class="btn btn-ghost p-2"
      onclick={toggleMobileMenu}
      aria-label="Toggle navigation menu"
      aria-expanded={mobileMenuOpen}
    >
      {#if mobileMenuOpen}
        <!-- Close icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M18 6L6 18M6 6l12 12" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {:else}
        <!-- Hamburger icon -->
        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
          <path d="M3 12h18M3 6h18M3 18h18" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
        </svg>
      {/if}
    </button>

    <!-- Mobile Menu Dropdown -->
    {#if mobileMenuOpen}
      <div class="mobile-menu slide-in-down">
        {#each items as item}
          <button
            class="mobile-nav-item {isActive(item) ? 'mobile-nav-item-active' : ''}"
            onclick={() => handleItemClick(item)}
            aria-current={isActive(item) ? 'page' : undefined}
          >
            {#if item.icon}
              <span class="nav-icon">{@html item.icon}</span>
            {/if}
            <span>{item.label}</span>
          </button>
        {/each}
      </div>
    {/if}
  </div>
</nav>

<style>
  .responsive-nav {
    position: relative;
  }

  .nav-item {
    display: flex;
    align-items: center;
    gap: 0.5rem;
    padding: 0.75rem 1rem;
    border-radius: 8px;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-weight: 500;
    text-decoration: none;
    transition: all 0.2s ease;
    cursor: pointer;
    font-family: inherit;
  }

  .nav-item:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .nav-item-active {
    background: var(--accent-color);
    color: white;
  }

  .nav-item-active:hover {
    background: var(--accent-hover);
  }

  .nav-icon {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 20px;
    height: 20px;
  }

  .mobile-menu {
    position: absolute;
    top: 100%;
    left: 0;
    right: 0;
    background: var(--bg-card);
    border: 1px solid var(--border-color);
    border-radius: 8px;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    z-index: 50;
    margin-top: 0.5rem;
  }

  .mobile-nav-item {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    width: 100%;
    padding: 1rem;
    background: transparent;
    border: none;
    color: var(--text-secondary);
    font-weight: 500;
    text-align: left;
    transition: all 0.2s ease;
    cursor: pointer;
    font-family: inherit;
    border-bottom: 1px solid var(--border-color);
  }

  .mobile-nav-item:last-child {
    border-bottom: none;
  }

  .mobile-nav-item:hover {
    background: var(--bg-secondary);
    color: var(--text-primary);
  }

  .mobile-nav-item-active {
    background: var(--accent-color);
    color: white;
  }

  .mobile-nav-item-active:hover {
    background: var(--accent-hover);
  }
</style>