const     attr = (el, attr)=> el.getAttribute(attr);

export class HttpRequestElement extends HTMLElement
{
    // @attribute url
    constructor() {
        super();
    }
    sliceInit( s )
    {   if( !s )
            s = {};
        s.element = this;
        if( s.destroy )
            return;
        const controller = new AbortController();
        s.destroy = ()=>
        {   // todo destroy slices in custom-element
            controller.abort();
        };
        const     url = attr(this, 'url') || ''
        ,     request = { url }
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
            slice.detail.response = await fetch(url,{ signal: controller.signal });
            updateSlice( slice );
            slice.detail.data = await slice.detail.response.json();
            updateSlice( slice );
        },0 );

        return s;
    }
}

window.customElements.define( 'http-request', HttpRequestElement );
export default HttpRequestElement;