<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet xmlns:xsl="http://www.w3.org/1999/XSL/Transform" version="1.0">
    <xsl:output method="html"/>

    <xsl:template match="/">
        <xsl:apply-templates select="//attributes"/>
    </xsl:template>
    <xsl:template match="attributes">
        <h3 xmlns="http://www.w3.org/1999/xhtml">
            <xsl:value-of select="title"></xsl:value-of>
        </h3> <!-- title is an attribute in instance
                                                             mapped into /*/attributes/title -->
        <xsl:if xmlns="http://www.w3.org/1999/xhtml" test="//smile">                 <!-- data-smile DCE instance attribute,
                                                             mapped into /*/dataset/smile
                                                             used in condition -->
            <!-- data-smile DCE instance attribute, used as HTML -->
            <div>Smile as:
                <xsl:value-of select="//smile"></xsl:value-of>
            </div>
        </xsl:if>
        <!-- image would not be visible in sandbox, see live demo -->
        <img xmlns="http://www.w3.org/1999/xhtml"
             src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/{pokemon-id}.svg"
             alt="{title} image"/>
        <!-- image-src and title are DCE instance attributes,
             mapped into /*/attributes/
             used within output attribute via curly brackets -->

        <!-- `slot name=xxx` replaced with elements with `slot=xxx` attribute -->
        <p xmlns="http://www.w3.org/1999/xhtml">
            <xsl:value-of select="//*[@slot=&quot;description&quot;]"/>
        </p>
        <xsl:for-each xmlns="http://www.w3.org/1999/xhtml" select="//*[@pokemon-id]">
            <!-- loop over payload elements with `pokemon-id` attribute -->
            <button>
                <img height="32"
                     src="https://unpkg.com/pokeapi-sprites@2.0.2/sprites/pokemon/other/dream-world/{@pokemon-id}.svg"
                     alt="{text()}"/>
                <br/>
                <xsl:value-of select="text()">
                </xsl:value-of>
            </button>

        </xsl:for-each>
    </xsl:template>
</xsl:stylesheet>