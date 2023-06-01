<?xml version="1.0" encoding="UTF-8"?>
<xsl:stylesheet version="1.0"
	xmlns="http://www.w3.org/1999/xhtml"
	xmlns:xhtml="http://www.w3.org/1999/xhtml"
	xmlns:xsl="http://www.w3.org/1999/XSL/Transform"
	xmlns:func="http://exslt.org/functions"
	xmlns:my="my://own.uri"
	xmlns:xv="http://xmlaspect.org/XmlView"
	xmlns:exslt="http://exslt.org/common"
	xmlns:msxsl="urn:schemas-microsoft-com:xslt"
	exclude-result-prefixes="xhtml exslt msxsl"
	extension-element-prefixes="func"
>
	<xsl:output
	method="html"
	omit-xml-declaration="yes"
	standalone="yes"
	indent="yes"
  />
    <!--
        let processor = new XSLTProcessor();  // starts the XSL processor
        processor.setParameter(null, "baseUrl", new URL('./', import.meta.url).pathname);
    -->
	<xsl:param name="url" />
	<xsl:param name="baseUrl" select="substring-before(substring-after(/processing-instruction('xml-stylesheet'),'href=&quot;'),'table.xsl&quot;')"  />
	<xsl:param name="sort" />
	<!-- select = "exslt:node-set($x) IE compatibility -->
		<msxsl:script language="JScript" implements-prefix="exslt">
			<![CDATA[
				var dd = eval("this['node-set'] =  function (x) { return x; }");
			]]>
		</msxsl:script>

	<xsl:variable name="sorts"	select="//xsl:sort"	/>

    <func:function name="my:count-elements">
      <func:result select="count(//*)" />
	</func:function>

	<xsl:template match="/">
				<style>
					body{padding:0;margin:0;}
					table {border-collapse:collapse; width:100%; font-family: "HelveticaNeue-Light", "Helvetica Neue Light", "Helvetica Neue", Helvetica, Arial, "Lucida Grande", sans-serif;}
					caption{ text-align:left; }
					th					{background-image: linear-gradient(to bottom, #0F1FFF 0%, #AAAACC 100%); font-size:large;}
					tr:nth-child(even)	{background-image: linear-gradient(to bottom, rgba(9, 16, 11, 0.2) 0%, rgba(90, 164, 110, 0.1) 100%);}
					tr:nth-child(odd)	{background: rgba(255,255,255,0.2);}
					td{font-size:small;border-bottom: none;border-top: none;}
					th a{ color: #FFFF80; text-decoration:none; display:block;}
					th a span{float:left;}
					div>label, div>var{ margin-right:0.5em;}

					fieldset{border-radius: 1em;border-bottom: none;border-left: none;}

					/* collapse and select UI */
					fieldset legend label{ cursor:pointer;}
					input[type='checkbox']{ display:none;}

					input[type='checkbox']:checked+fieldset{ border:2px solid red; }
					input[type='checkbox']:checked+input+fieldset div,
					input[type='checkbox']:checked+input+fieldset legend label.collapse i,
					input[type='checkbox']:checked+fieldset .select i,
					input[type='checkbox']+fieldset .collapse b,
					input[type='checkbox']+fieldset .select b
					{display:none; }

					input[type='checkbox']:checked+input+fieldset .collapse b,
					input[type='checkbox']+input:checked+fieldset .select b
					{ display:inline;}

					legend label{ text-shadow: -1px -1px 1px #fff, -1px 0px 1px #fff, 0px -1px 1px #fff, 1px 1px 1px #999, 0px 1px 1px #999, 1px 0px 1px #999, 1px 1px 5px #113;}
					legend label b, legend label i{ margin-right: 0.5em; }
				</style>
				<xsl:variable name="sortedData">
					<xsl:call-template name="StartSort">
						<xsl:with-param name="data" select="*" />
					</xsl:call-template>
				</xsl:variable>
				<div class="XmlViewRendered">
					<xsl:apply-templates select="exslt:node-set($sortedData)" mode="DisplayAs"/>
				</div>
	</xsl:template>
	<xsl:template match="/" priority="-20" name="BodyOnly">
		<xsl:variable name="sortedData">
			<xsl:call-template name="StartSort">
				<xsl:with-param name="data" select="*" />
			</xsl:call-template>
		</xsl:variable>
		<xsl:apply-templates select="exslt:node-set($sortedData)" mode="DisplayAs"/>
	</xsl:template>

<xsl:template name="StartSort">
	<xsl:param name="data"/>
	<xsl:param name="sortNode"/>
	<xsl:apply-templates mode="SortData" select="$data">
		<xsl:with-param name="sortNode" select="$sortNode" />
	</xsl:apply-templates>
</xsl:template>



<xsl:template mode="SortData" match="*[*]" name="SortDataDefault">
	<xsl:copy>
		<xsl:copy-of select="@*"/>
		<xsl:apply-templates mode="SortData" select="*">
			<xsl:sort data-type="text" order="ascending" select="@stub-will-be-replaced"/>
		</xsl:apply-templates>
	</xsl:copy>
</xsl:template>

<xsl:template mode="SortData" match="*[not(*)]">
	<xsl:copy><xsl:copy-of select="@*"/><xsl:value-of select="."/></xsl:copy>
</xsl:template>

<!-- skip XmlView injected data from sorting results -->
<xsl:template mode="SortData"		match="*[@priority='100']" priority="300"></xsl:template>
<xsl:template mode="DisplayAsTable" match="*[@priority='100']" priority="300"></xsl:template>

	<xsl:template mode="DisplayAs"	match="*" ><!-- distinct tags, match to 1st  -->
		<xsl:variable name="tagName" select="name()" />
		<xsl:choose>
			<xsl:when test="count( ../*[name()=$tagName]) != 1">
				<xsl:apply-templates select="." mode="DisplayAsTable" />
			</xsl:when>
			<xsl:otherwise>
				<xsl:apply-templates select="." mode="DisplayAsTree" />
			</xsl:otherwise>
		</xsl:choose>
	</xsl:template>
	<xsl:template mode="DisplayAs"	match="@*" >
		<b><xsl:value-of select="name()"/></b>=<var><xsl:value-of select="."/></var>
	</xsl:template>
	<xsl:template mode="DisplayAsTree" match="*[not(*)]" priority="20">
		<div><label><xsl:value-of select="name()"/></label>
			<xsl:apply-templates select="@*" mode="DisplayAs"/>
			<var><xsl:value-of select="."/></var>
		</div>
	</xsl:template>

	<xsl:template mode="DisplayAsTree" match="*" >
		<xsl:variable name="xPath"><xsl:apply-templates mode="xpath" select="."/></xsl:variable>
		<input type="checkbox" id="collapse{$xPath}" class="collapseControl"/>
		<input type="checkbox" id="select{$xPath}"/>
		<fieldset>
			<legend><label for="collapse{$xPath}" class="collapse"><b>&#9654;</b><i>&#9660;</i></label> <label for="select{$xPath}" class="select"><b>&#10004;</b><i>&#10003;</i></label> <xsl:value-of select="name()"/></legend>
			<div>
				<xsl:apply-templates select="." mode="DisplayContent"/>
			</div>
		</fieldset>
	</xsl:template>
	<xsl:template mode="DisplayContent" match="*">
		<xsl:for-each select="@*|*">
			<xsl:variable name="tagName" select="name()"/>

			<xsl:if test="not(preceding-sibling::*[name()=$tagName])">
				<xsl:apply-templates select="." mode="DisplayAs"/>
			</xsl:if>
		</xsl:for-each>
		<xsl:if test="normalize-space(text()) != '' ">
			<p><xsl:value-of select="text()"/></p>
		</xsl:if>
	</xsl:template>

	<xsl:template match="*" mode="DisplayAsTable" >
		<xsl:param name="childName" select="name()"/>
		<xsl:variable name="ZZheaders" select="@*|*" />		<!-- first child attributes and its children -->
															<!-- TODO union of unique child names as not all rows have same children set. When sorting the missing attributes changing number of columns -->
		<xsl:variable name="collection"  select=".."/>
		<xsl:variable name="collectionPath"><xsl:apply-templates mode="xpath" select=".."></xsl:apply-templates></xsl:variable>

		<xsl:variable name="hAll">
			<xsl:for-each select="*|@*">
				<xsl:variable name="p"  select="name()"/>
				<xsl:choose>
					<xsl:when test="count(.|../@*)=count(../@*)"><xsl:element name="{$p}"><xsl:attribute name="xv" ><xsl:value-of select="$p" /></xsl:attribute></xsl:element></xsl:when>
					<xsl:when test="count( preceding-sibling::*[name()=$p]) != 0"></xsl:when>
					<xsl:otherwise><xsl:copy/></xsl:otherwise>
				</xsl:choose>
			</xsl:for-each>
		</xsl:variable>
		<xsl:variable name="headers" select="exslt:node-set($hAll)/*" />
		<table border="1">
			<caption><!-- todo collapsible -->
				<var>
					<xsl:attribute name="title"><xsl:value-of select="$collectionPath"/>/<xsl:value-of select="$childName"/></xsl:attribute>
					<xsl:value-of select="$childName"/>
				</var>
			</caption>
			<thead>
				<tr>
					<xsl:for-each select="$headers">
						<xsl:variable name="p" ><xsl:if test="name(.)=@xv">@</xsl:if><xsl:value-of select="local-name()"/></xsl:variable>
						<xsl:variable name="fullPath" ><xsl:value-of select="$collectionPath"/>/<xsl:value-of select="$p"/></xsl:variable>
						<xsl:variable name ="direction"		>
							<xsl:for-each select="$sorts">
								<xsl:if test="@select=$p">
									<xsl:choose>
										<xsl:when test="@order='ascending'">&#9650;</xsl:when>
										<xsl:when test="@order='descending'">&#9660;</xsl:when>
										<xsl:otherwise>&#9674;</xsl:otherwise>
									</xsl:choose>
								</xsl:if>
							</xsl:for-each>
						</xsl:variable>
						<xsl:variable name ="order"		>
							<xsl:for-each select="$sorts">
								<xsl:if test="@select=$p">
									<xsl:value-of select="count(preceding-sibling::xsl:sort) "/>
								</xsl:if>
							</xsl:for-each>
						</xsl:variable>

						<th><a	href="#"
								title="{$p}"
								xv:sortpath="{$p}"
							   ><span><xsl:value-of select="$direction"/> <sub><xsl:value-of select="$order"/> </sub></span>

								<xsl:value-of select="local-name()"/>
							</a>
						</th>
					</xsl:for-each>
				</tr>
			</thead>
			<tbody>
				<xsl:for-each select="../*[name()=$childName]">
					<xsl:variable name="rowNode" select="." />
					<tr>
						<xsl:for-each select="$headers">
							<xsl:variable name="key" select="name()" />
							<td>
								<!-- xsl:attribute name="title"><xsl:apply-templates mode="xpath" select="."></xsl:apply-templates></xsl:attribute -->

								<xsl:choose>
									<xsl:when test="count( $rowNode/*[name()=$key]) &gt; 1">
										<xsl:apply-templates select="$rowNode/*[name()=$key][1]" mode="DisplayAsTable" />
									</xsl:when>
									<xsl:otherwise>
										<xsl:apply-templates mode="DisplayContent" select="$rowNode/*[name()=$key]|$rowNode/@*[name()=$key]" />
									</xsl:otherwise>
								</xsl:choose>

							</td>
						</xsl:for-each>
					</tr>
				</xsl:for-each>
			</tbody>
		</table>
	</xsl:template>

	<!-- XmlAspect/XOR/XPath/Dom2XPath.xsl -->
	<!-- Root -->
	<xsl:template match="/" mode="xpath">
		<xsl:text>/</xsl:text>
	</xsl:template>

	<!-- Element -->
	<xsl:template match="*" mode="xpath">
		<!-- Process ancestors first -->
		<xsl:apply-templates select=".." mode="xpath"/>

		<!-- Output / if not already output by the root node -->
		<xsl:if test="../..">/</xsl:if>

		<!-- Output the name of the element -->
		<xsl:value-of select="name()"/>

		<!-- Add the element's position to pinpoint the element exactly -->
		<xsl:if test="count(../*[name() = name(current())]) > 1">
			<xsl:text>[</xsl:text>
			<xsl:value-of
				select="count(preceding-sibling::*[name() = name(current())]) +1"/>
			<xsl:text>]</xsl:text>
		</xsl:if>

		<!-- Add 'name' predicate as a hint of which element -->
		<xsl:if test="@name">
			<xsl:text/>[@name="<xsl:value-of select="@name"/>"]<xsl:text/>
		</xsl:if>
	</xsl:template>

	<!-- Attribute -->
	<xsl:template match="@*" mode="xpath">
		<!-- Process ancestors first -->
		<xsl:apply-templates select=".." mode="xpath"/>

		<!-- Output the name of the attribute -->
		<xsl:text/>/@<xsl:value-of select="name()"/>

		<!-- Output the attribute's value as a predicate -->
		<xsl:text/>[.="<xsl:value-of select="."/>"]<xsl:text/>
	</xsl:template>

</xsl:stylesheet>