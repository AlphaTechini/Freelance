<script>
  let {
    type = 'text',
    value = $bindable(''),
    placeholder = '',
    label = '',
    error = '',
    disabled = false,
    required = false,
    class: className = '',
    ...rest
  } = $props();

  const baseClasses = 'w-full px-4 py-3 border-2 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';
  
  const errorClasses = error 
    ? 'border-red-500 focus:border-red-500 focus:ring-red-500' 
    : 'border-gray-300 dark:border-gray-600 focus:border-orange-500 focus:ring-orange-500';
  
  const classes = `${baseClasses} ${errorClasses} ${className}`;

</script>

{#if label}
  <label class="block mb-2 font-medium text-gray-900 dark:text-white">
    {label}
    {#if required}
      <span class="text-red-500">*</span>
    {/if}
  </label>
{/if}

<input
  {type}
  {placeholder}
  {disabled}
  {required}
  bind:value
  class={classes}
  {...rest}
/>

{#if error}
  <p class="mt-1 text-sm text-red-500">{error}</p>
{/if}
