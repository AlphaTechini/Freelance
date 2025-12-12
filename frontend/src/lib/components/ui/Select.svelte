<script>
  let {
    value = $bindable(''),
    options = [],
    placeholder = 'Select an option...',
    label = '',
    error = '',
    disabled = false,
    required = false,
    class: className = '',
    ...rest
  } = $props();

  const getSelectClasses = () => {
    let classes = 'form-select';
    
    if (error) {
      classes += ' !border-red-500 focus:!border-red-500 focus:!shadow-red-100';
    }
    
    return `${classes} ${className}`;
  };
</script>

<div class="form-group">
  {#if label}
    <label class="form-label">
      {label}
      {#if required}
        <span class="text-error">*</span>
      {/if}
    </label>
  {/if}

  <select
    {disabled}
    {required}
    bind:value
    class={getSelectClasses()}
    {...rest}
  >
    {#if placeholder}
      <option value="" disabled selected={!value}>{placeholder}</option>
    {/if}
    
    {#each options as option}
      {#if typeof option === 'string'}
        <option value={option}>{option}</option>
      {:else}
        <option value={option.value}>{option.label}</option>
      {/if}
    {/each}
  </select>

  {#if error}
    <div class="form-error">{error}</div>
  {/if}
</div>