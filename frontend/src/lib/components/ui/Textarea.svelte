<script>
  let {
    value = $bindable(''),
    placeholder = '',
    label = '',
    error = '',
    disabled = false,
    required = false,
    rows = 4,
    class: className = '',
    ...rest
  } = $props();

  const getTextareaClasses = () => {
    let classes = 'form-textarea';
    
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

  <textarea
    {placeholder}
    {disabled}
    {required}
    {rows}
    bind:value
    class={getTextareaClasses()}
    {...rest}
  ></textarea>

  {#if error}
    <div class="form-error">{error}</div>
  {/if}
</div>