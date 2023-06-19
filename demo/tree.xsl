<xsl:stylesheet version="1.0"
                xmlns:xsl="http://www.w3.org/1999/XSL/Transform">
    <xsl:output
            method="html"
            omit-xml-declaration="yes"
            standalone="yes"
            indent="yes"
    />

    <xsl:template match="/">
        <xsl:apply-templates select="*"/>
    </xsl:template>
    <xsl:template match="*">
        <details style="padding:0 1rem" open="open">
            <summary>
                <b style="color:green"><xsl:value-of select="name()"/></b>
                <xsl:apply-templates select="@*"/>
            </summary>
            <xsl:value-of select="./text()"/>
            <xsl:apply-templates select="*"/>
        </details>
    </xsl:template>
    <xsl:template match="@*">
        <code style="margin-left:1rem;color:brown"><xsl:value-of select="name()"/>="<xsl:value-of select="."/>"</code>
    </xsl:template>
    <xsl:template match="text()">
            <p>
                <xsl:value-of select="."/>
            </p>
    </xsl:template>


</xsl:stylesheet>