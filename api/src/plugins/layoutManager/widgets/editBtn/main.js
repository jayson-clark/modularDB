function openPage(pluginID, pageID) {
    window.open(`/pages/${pluginID}/${pageID}?token=${token}`, '_blank');
}