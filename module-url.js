const attr = ( el, attr )=> el.getAttribute( attr );


export class ModuleUrl extends HTMLElement
{
    static observedAttributes=
            [   'slice'
            ,   'src' // module path, relative or absolute URL
            ];

    sliceInit()
    {   let path = attr(this,'src');
        try
        {   const url =  '.' === path.charAt(0)
                ? new URL(path, this.closest('[base]')?.getAttribute('base') ).href
                : import.meta.resolve(path);
            this.setAttribute('value',this.value = url );
        }catch( er )
        {   this.setAttribute('error', er.message);
            this.setAttribute('value', path);
            console.error(er.message ?? er, path);
        }
        this.dispatchEvent( new Event('change') );
    }
    attributeChangedCallback( name, oldValue, newValue )
    {
        if( 'src'=== name )
            this.sliceInit();
    }
}

window.customElements.define( 'module-url', ModuleUrl );
export default ModuleUrl;