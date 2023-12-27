const     attr = (el, attr)=> el.getAttribute(attr);

export class HttpRequestElement extends HTMLElement
{
    static get observedAttributes() {
        return  [   'value' // populated from localStorage, if defined initially, sets the value in storage
                ,   'slice'
                ,   'url'
                ,   'method'
                ,   'header-accept'
                ]
    }

    get requestHeaders()
    {   const ret = {};
        [...this.attributes].filter(a=>a.name.startsWith('header-')).map( a => ret[a.name.substring(7)] = a.value );
        return ret
    }
    get requestProps()
    {   const ret = {};
        [...this.attributes].filter(a=>!a.name.startsWith('header-')).map( a => ret[a.name] = a.value );
        return ret
    }

    disconnectedCallback(){ this._destroy?.(); }

    connectedCallback()
    {   const controller = new AbortController();
        this._destroy = ()=> controller.abort(this.localName+' disconnected');

        const     url = attr(this, 'url') || ''
        ,     request = { ...this.requestProps, headers: this.requestHeaders }
        ,       slice = { request }
        ,      update = () => this.dispatchEvent( new Event('change') );
        this.value = slice;
        setTimeout( async ()=>
        {   update();
            const response = await fetch(url,{ ...this.requestProps, signal: controller.signal, headers: this.requestHeaders })
            ,      r = {headers: {}};
            [...response.headers].map( ([k,v]) => r.headers[k] = v );
            'ok,status,statusText,type,url,redirected'.split(',').map( k=> r[k] = response[k] )

            slice.response = r;
            update();
            slice.data = await response.json();
            update();
        },0 );
    }
}

window.customElements.define( 'http-request', HttpRequestElement );
export default HttpRequestElement;
