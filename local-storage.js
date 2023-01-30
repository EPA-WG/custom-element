export class LocalStorage extends HTMLElement
{
        constructor()
        {
            super();
            const attr = name => this.getAttribute(name)
            ,      key = attr('key');
            this.addEventListener('load',()=>
            {   this.dispatchEvent( new Event('loadend',    {  bubbles: true
                                                            ,     data: localStorage.getItem( key() )
                                                            ,    slice:attr('slice')
                                                            ,   target: this
                                                            }));
            });
        }

}