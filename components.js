//
// THIS FILE IS FOR DOCUMENTATION PURPOSES ONLY. 
// THESE COMPONENTS ARE NOT FOR PRODUCTION USE.
//


/**
 * @slot - This is a default/unnamed slot
 *
 * @summary This is a DCE Link
 *
 * @tag dce-link
 */
class DceLink extends HTMLElement {}

customElements.define('dce-link', DceLink);

/**
 * @slot slot2 - You can put some elements here
 *
 * @summary This is a DCE with a slot
 *
 * @tag dce-2-slots
 */
class Dce2Slots extends HTMLElement {}

customElements.define('dce-2-slots', Dce2Slots);

/**
 * @slot - This is a default/unnamed slot
 *
 * @summary This is a DCE with slots
 *
 * @tag dce-3-slot
 */
class Dce3Slot extends HTMLElement {}

customElements.define('dce-3-slot', Dce3Slot);

/**
 * @slot - This replaces the start of the greeting
 *
 * @summary This is a DCE for greeting users
 *
 * @tag greet-element
 */
class GreetElement extends HTMLElement {}

customElements.define('greet-element', GreetElement);


/**
 * @attribute {string} title - the name of the Pokemon
 * @attribute {number} pokemon-id - the Pokemon's ID
 * 
 * @slot description - This replaces the Pokemon description
 *
 * @summary This is a DCE for displaying Pokemon
 *
 * @tag pokemon-tile
 */
class PokemonTile extends HTMLElement {}

customElements.define('pokemon-tile', PokemonTile);