const attr = (el, attr)=> el.getAttribute(attr);

export class LocalStorageElement extends HTMLElement
{
        constructor()
        {
            super();
            // const attr = name => this.getAttribute(name)
            // ,      key = attr('key');
            // this.addEventListener('transformation',()=>
            // {   this.dispatchEvent( new Event('loadend',    {    bubbles: true
            //                                                 , cancelable: true
            //                                                 ,       data: JSON.parse( localStorage.getItem( key() ) )
            //                                                 ,      slice: attr('slice')
            //                                                 ,     target: this
            //                                                 }));
            // });
        }
        sliceInit( data )
        {   const v = localStorage.getItem( attr( this,'key' ) );
            const zz = this.dispatchEvent( new CustomEvent('loadend',
                {  bubbles: true
                , cancelable: true
                ,   detail: v.startsWith('{') ? JSON.parse( v ) : v
                }));

            return data || {}
        }
}

window.customElements.define( 'local-storage', LocalStorageElement );
export default LocalStorageElement;