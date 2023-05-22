const     attr = (el, attr)=> el.getAttribute(attr);

export class HttpRequestElement extends HTMLElement
{
    // @attribute url
    constructor() {
        super();
    }
    get requestHeaders()
    {   const ret = {};
        [...this.attributes].filter(a=>a.name.startsWith('header-')).map( a => ret[a.name.substring(7)] = a.value );
        return ret;
    }
    get requestProps()
    {   const ret = {};
        [...this.attributes].filter(a=>!a.name.startsWith('header-')).map( a => ret[a.name] = a.value );
        return ret;
    }
    sliceInit( s )
    {   if( !s )
            s = {};
        s.element = this;
        if( s.destroy )
            return s;
        const controller = new AbortController();
        s.destroy = ()=>
        {   // todo destroy slices in custom-element
            controller.abort();
        };
        const     url = attr(this, 'url') || ''
        ,     request = { ...this.requestProps, headers: this.requestHeaders }
        ,       slice = { detail: { request }, target: this }
        , updateSlice = slice =>
        {   for( let parent = s.element.parentElement; parent; parent = parent.parentElement )
                if ( parent.onSlice )
                    return parent.onSlice(slice);
            console.error(`${this.localName} used outside of custom-element`)
            debugger;
        };

        setTimeout( async ()=>
        {   updateSlice( slice );
            const response = await fetch(url,{ ...this.requestProps, signal: controller.signal, headers: this.requestHeaders })
            ,      r= {headers: {}};
            [...response.headers].map( ([k,v]) => r.headers[k]=v );
            'ok,status,statusText,type,url,redirected'.split(',').map(k=>r[k]=response[k])

            slice.detail.response = r;
            updateSlice( slice );
            const detail = {...slice.detail}
            detail.data = await response.json();
            const s = {...slice, detail}
            updateSlice( s );
        },0 );

        return s;
    }
}

window.customElements.define( 'http-request', HttpRequestElement );
export default HttpRequestElement;
