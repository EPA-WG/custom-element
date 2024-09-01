/**
 * node xslDtd2Ide.cjs
 * would get xsl 1.0 schema and populate IntelliJ and VS Code IDE custom elements definitions
 *
 * This is one time use script as XSLT 1.0 schema is not changing.
 * DTD parsing here is not generic and cobers only particula XSLT 1.0 schema.
 */
import { readFileSync, writeFileSync } from 'node:fs';


const dtdText = await fetch( 'https://www.w3.org/1999/11/xslt10.dtd' )
    .then( ( response ) => response.text() )
    .then( ( body ) =>
    {
        return body;
    } );
const matches = dtdText.match( /<([^>]*)>/g );

const chopOff = ( s, begin = 1, end = 1 ) => s.substring( begin, s.length - end );
const trim = s => s?.trim ? s.trim() : s;

let lastComment = ''
const dtdObj = { ENTITY: {}, ELEMENT: {} }
for( const match of matches ){
    if( match.startsWith( '<!--' ) ) {
        lastComment = match;
        continue;
    }
    const body = chopOff( match, 2 );
    const arr = body.split( /\s/ );
    const name = arr[ 1 ].trim();
    const resolveRef = s => s ? ( s.startsWith ? ( s.startsWith( '%' ) ? dtdObj.ENTITY[ chopOff( s, 1, 0 ).replace( ';',
        '' ) ] : s ) : s ) : s;
    const attrObj = a =>
    {
        if( !a || Array.isArray( a ) || !a.trim )
            return a;
        const as = a.trim();
        if( 'CDATA,#PCDATA,NMTOKEN,NMTOKENS,'.includes( as + ',' ) )
            return as;
        const ar = as.split( ';' )
        const aa = ar[ 0 ].split( ' ' );
        // if( aa[0].includes('select')){debugger;}
        return { name: aa[ 0 ], type: resolveRef( aa[ 1 ] ), defValue: aa[ 1 ], required: (ar[1] || aa[ 2 ])?.trim() }
    };
    switch( arr[ 0 ] ){
        case 'ENTITY':{
            let key = arr[ 2 ];
            let val = body.substring( body.indexOf( key ) + key.length ).trim();
            let ss;
            if( val.startsWith( '"' ) || val.startsWith( "'" ) ) {
                val = chopOff( val );
                if( val.includes( '(#PCDATA' ) ) {
                    val = val.replace( '(#PCDATA', '' ).replace( ')*', '' ).trim();
                    ss = [ '#PCDATA', ...val.split( '\n' ).map( s => s.trim() ).map( resolveRef ).flat() ];
                } else
                    ss = val.split( /[\n]/ ).map( s => s.replace( '|', '' ).trim() ).filter( s => s );
            } else
                ss = val.split( /[|\n]/ );

            const v = ss.map( trim ).filter( s => s ).map( resolveRef ).map( attrObj ).flat().filter( s => s );
            dtdObj.ENTITY[ key ] = !v.length ? '' : v.length === 1 ? v[ 0 ] : v;
            break;
        }
        case 'ELEMENT':
            dtdObj.ELEMENT[ name ] = { values: arr[ 2 ], attributes: [] };
            break;
        case 'ATTLIST':{
            const attrStr = body.split( name )[ 1 ].trim();
            const attrs = attrStr.split( '\n' ).map( s => s.trim() );
            const elementAttrs = dtdObj.ELEMENT[ name ].attributes;
            for( let a of attrs ){
                if( a.startsWith( '%' ) ) {
                    const v = dtdObj.ENTITY[ chopOff( a.split( ';' )[ 0 ], 1, 0 ) ];
                    if( !v ) {
                        debugger;
                    }
                    Array.isArray( v )
                    ? elementAttrs.push( ...v )
                    : elementAttrs.push( v );
                } else
                    elementAttrs.push( attrObj( a ) );
            }

            break;
        }
    }
}

// replace the tags list in custom-element.js

const tagsCsv = Object.keys( dtdObj.ELEMENT ).map( s => s.replace( 'xsl:', '' ) ).join( ',' );
const jsText = readFileSync( '../custom-element.js', 'utf8' )
const updatedJs = jsText.replace( /^.*export const xslTags = .*$/mg,
    `export const xslTags = '${ tagsCsv }'.split(',');` );
writeFileSync( '../custom-element.js', updatedJs );

const vsCode = {
    "version": 1.1, tags: Object.keys( dtdObj.ELEMENT ).map( s => (
        {   name        : s.replace( 'xsl:', '' )
        ,   description : `${ s }`
        ,   attributes  : dtdObj.ELEMENT[ s ].attributes.map( a => (
                            {   name         : a.name
                            ,   description: `${ JSON.stringify( a ) }`
                            ,   type       : "string"
                            ,   required    : a.required === '#REQUIRED'
                            } ) )
        ,    references : [ {   name: "MDN docs"
                            ,   url : `https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/${s.replace( 'xsl:', '' )}`
                            }]
        } ) )
};

writeFileSync( '.././ide/customData-xsl.json', JSON.stringify( vsCode, undefined, 4 ) );

const intelliJ = {
    "$schema": "http://json.schemastore.org/web-types",
    "name": "@epa-wg/custom-element",
    "version": "0.0.26",
    "js-types-syntax": "typescript",
    "description-markup": "markdown",
    "contributions": {
        "html": {
            "elements": [
                ...Object.keys( dtdObj.ELEMENT ).map( s => (
                    {   name        : s.replace( 'xsl:', '' )
                        ,   description : `${ s }`
                        ,   attributes  : dtdObj.ELEMENT[ s ].attributes.map( a => (
                            {   name        : a.name
                            ,   description : `${ JSON.stringify( a ) }`
                            ,   type        : "string"
                            ,   required    : a.required === '#REQUIRED'
                            } ) )
                        ,   'doc-url'   : `https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/${s.replace( 'xsl:', '' )}`
                    } ) ),
                {
                    "name": "for-each",
                    "description": "The <xsl:for-each> element selects a set of nodes and processes each of them in the same way. It is often used to iterate through a set of nodes or to change the current node. If one or more <xsl:sort> elements appear as the children of this element, sorting occurs before processing. Otherwise, nodes are processed in document order.",
                    "doc-url": "https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/for-each",
                    "attributes": [
                        {
                            "name": "select",
                            "description": "Uses an XPath expression to select nodes to be processed.",
                            "required": true,
                            "doc-url": "https://developer.mozilla.org/en-US/docs/Web/XSLT/Element/for-each#select",
                            "value": {
                                "type": "string"
                            }
                        }
                    ]
                }
            ]
        }
    }
};


writeFileSync( '.././ide/web-types-xsl.json', JSON.stringify( intelliJ, undefined, 4 ) );


