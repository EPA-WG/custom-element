# Fix for Issue #77: Attribute Deletion Leading to Infinite Rendering

## Problem Description

When an outer custom element omits an attribute that an inner custom element has enforced (particularly exposed attributes with `select` expressions), infinite rendering occurs. This was described as a "deadlock" due to infinite loops.

**Example from `demo/form.html`:**
```html
<!-- Child definition with enforced 'value' attribute -->
<custom-element tag="sample-input">
    <template>
        <attribute name="value" select="//val"></attribute>
        ...
    </template>
</custom-element>

<!-- Parent uses child WITHOUT 'value' attribute -->
<custom-element>
    <template>
        <form>
            <sample-input slice="inp1" name="inp-1"></sample-input>
        </form>
    </template>
</custom-element>
```

## Root Cause

The infinite loop occurs due to a conflict between the merge and attribute update phases:

1. **During merge()**: The parent's XSLT output includes the child element but doesn't include attributes the parent didn't provide. The `mergeAttr()` function removes these attributes from the child.

2. **Removal triggers attributeChangedCallback**: When an attribute is removed, `attributeChangedCallback()` is triggered, which calls `transform()`.

3. **Transform re-adds the attribute**: The transform includes the attribute in the output (because it's a hardcoded/exposed attribute), re-adding it to the element.

4. **Infinite loop**: The attribute removal and re-addition cycle indefinitely, each triggering a new transform.

## Solution: Debounce Transform Calls

The code comment at line 962 suggested: `// needs throttling`

The fix implements a **debounce mechanism** for `transform()` calls:

### Changes Made

**File: `custom-element.js`**

1. **Added debounce timeout field** (line 753):
   ```javascript
   #transformTimeoutId = 0;
   ```

2. **Renamed the actual transform logic** (line 821):
   - Changed `const transform = this.transform = ()=>` to `const executeTransform = ()=>`
   - This separates the actual transformation work from the debounce wrapper

3. **Added debounced wrapper** (lines 941-944):
   ```javascript
   const transform = this.transform = ()=>
   {   clearTimeout(this.#transformTimeoutId);
       this.#transformTimeoutId = setTimeout(executeTransform, 1);
   };
   ```

### How It Works

- When `transform()` is called, it schedules `executeTransform()` to run after 1ms
- If `transform()` is called again before that 1ms elapses, the pending timeout is cancelled and a new one is scheduled
- Multiple rapid calls collapse into a single execution
- By the time `executeTransform()` runs, all pending attribute changes are already in the XML data model, allowing atomic processing

### Benefits

1. **Prevents infinite loops**: Rapid attribute changes don't cascade into infinite transforms
2. **Maintains responsiveness**: 1ms delay is imperceptible to users
3. **Minimal code change**: No need to restructure core logic
4. **Batches updates**: Multiple attribute changes are processed together

## Testing

To verify the fix:

1. **Open the demo**: `demo/form.html`
2. **Interact with the form**: 
   - Use example 5: "using custom-element as form input"
   - The `sample-input` elements should render and work correctly
   - No console warnings about "model update should not be the result of transform more than once"

3. **Check for infinite rendering**: 
   - The page should be responsive
   - No CPU spinning or excessive updates
   - Form interactions should work smoothly

## Related Code

The mergeAttr function (lines 570-575) already has protection for exported attributes:
```javascript
const ea = to.dceExportedAttributes
    , aa = to.getAttribute('dce-exported-attributes')
    , em = aa ? new Set( aa.split(' ') ) : null;
for( let a of to.getAttributeNames() )
    if( !from.hasAttribute(a) && !ea?.has(a) && !em?.has(a) )
        to.removeAttribute(a)
```

This prevents removal of attributes marked as exported/hardcoded. However, the debounce fix provides additional protection by preventing the rapid cycle of removal and re-addition.

## Compatibility

- No breaking changes
- No API changes
- Works with existing code
- Improves performance and stability
