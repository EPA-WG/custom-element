const     attr = (el, attr)=> el.getAttribute(attr);

export class HttpRequestElement extends HTMLElement
{
    static observedAttributes =
    [   'value' // populated from localStorage, if defined initially, sets the value in storage
    ,   'slice'
    ,   'url'
    ,   'method'
    ,   'header-accept'
    ];

    get requestHeaders()
    {   const ret = {};
        [...this.attributes].filter(a=>a.name.startsWith('header-')).map( a => ret[a.name.substring(7)] = a.value );
        return ret
    }
    get requestProps()
    {   const ret = {};
        [...this.attributes].filter(a=>!a.name.startsWith('header-'))
                            .filter(a=>!a.name.startsWith('slice')).map( a => ret[a.name] = a.value );
        return ret
    }

    disconnectedCallback(){ this.#destroy?.(); }

    connectedCallback()
    {
        setTimeout(()=>this.fetch(),0)
    }
    #inProgressUrl = ''
    #destroy = ()=>{}

    async fetch()
    {
        if( !this.closest('body') )
            return;
        const url = attr(this, 'url') || '';
        if( !url )
        {   this.#destroy?.();
            return this.value = {};
        }

        if( this.#inProgressUrl === url )
            return ;

        this.#inProgressUrl = url;
        const controller = new AbortController();
        this.#destroy = ()=> { controller.abort(this.localName+' disconnected'); this.#inProgressUrl = ''; }

        const request = { ...this.requestProps, headers: this.requestHeaders }
        ,       slice = { request }
        ,      update = () => this.dispatchEvent( new Event('change') );
        this.value = slice;

        update();
        const response = await fetch(url,{ ...this.requestProps, signal: controller.signal, headers: this.requestHeaders })
        ,      r = {headers: {}};
        [...response.headers].map( ([k,v]) => r.headers[k] = v );
        'ok,status,statusText,type,url,redirected'.split(',').map( k=> r[k] = response[k] )

        slice.response = r;
        update();
        if( r.headers['content-type']?.includes('json'))
            try
            {   slice.data = await response.json();
                update();
            }catch(_e){}
        if( r.headers['content-type']?.includes('xml'))
            try
            {   const s = await response.text();
                const parser = new DOMParser();
                slice.data = parser.parseFromString(s, 'application/xml')?.documentElement;
                update();
            }catch(_e){}
    }

    attributeChangedCallback(name, oldValue, newValue)
    {   if( name === 'url' )
        {   if( oldValue !== newValue)
            {
                oldValue && this.#destroy?.();
                if( newValue )
                    setTimeout(()=>this.fetch(),10)
                else
                {   this.value = {}
                    setTimeout(()=>this.dispatchEvent( new Event('change') ),10)
                }
            }
        }
    }

}

window.customElements.define( 'http-request', HttpRequestElement );
export default HttpRequestElement;
