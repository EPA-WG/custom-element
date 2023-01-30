<h1>DRAFT</h1>

# Data Sourse (DS) and transformation pipeline

The DS is the data provider for template and DCE. It defines the way to retrieve the data, does the data fetch and 
notifies the template owner on data availability. 
# DS types
The data samples which are needed for Declarative Web Application would include 
* remote data available over HTTP from URL, request parameters, and HTTP headers
* embedded into page data island(s) available over `#` anchors
* variety of storages including localStorage/sesionStorage
* web application properties like URI, app settings, import maps, etc.

# DS Life cycle 
## 1. Declaration
resides within template with the parameters populated by expression from template owner data.
```html
<custom-element>
    <local-storage key="{app/url/host}/key1" name="slice1"></local-storage>
</custom-element>
```

## 2. DataRequest Rendering iterations
DS initiated as DataRequest(**DR**) by [load](https://developer.mozilla.org/en-US/docs/Web/API/Window/load_event)
event. It starts its lifecycle as async process which emitted to itself as "process" event which bubbles uo to template holder. 

The process event passes 3 parameters:
* DS name
* data
* state 

Initially the state is "initiated" with default or no data, then "progress" with partial data, and in the end "completed" with final data. 
Process owner (template renderer) would populate the passed data slices into dataset and mark itself as "dirty" , i.e candidate for re-render upon finalizing the "pre-render" phase. 

## 3. final transformation
The DS can be instant routine which immediately return the final state. Sample of such is app settings. 

DS with finite steps is any remote call.

DS which is never ending samples are localStorage, application URL, clipboard, etc.

The transformation owner (DCE, include, etc.) would track the Data Request state change and keep re-rendering on each 
state change. This DR state change notification is the custom event which bubbles up to the transformation owner.

# Browser events vs API
In environments where the data sources custom elements and lifecycle events are not available, the transformation 'owner'
would be able to track data sources and generate new stream for each data state change. The following sequence of 
data loading and transformations would work even for PDF rendering.

1. transformation process (TP) would start the XSLT processing
2. on DS branch it would 
   * check the DS state by unique id(XPath?) in the template state.
   * if DS not yet initialized, 
     * create the data request(DR) object
     * DR is a process which continue to live in own thread and starts data retrieval.
     * DR, provides its state and data to transformation via data slice
     * DS data slice is set on the TP by the name with initial default value
     * notify the TR to mark the DR `incomplete`
     * finish transformation with blank data
3. when DR receives data or state change, it would notify the TR to mark the DR `incomplete`
4. TP would re-trigger the transformation on each DR state change. 
5. the transformation with all DRs in final state(error or completed) is counted as last.
It is up to implementation to break the current transformation when the any of DR status changes. 
Depend of application, either final or the sequence of rendered transforms could be used. 