async function includeHTML(id, file) {
    try {
        const response = await fetch(file);
        if (response.ok) {
            const content = await response.text();
            document.getElementById(id).innerHTML = content;
        }
    } catch (e) {
        console.error('Ошибка загрузки:', file);
    }
}

includeHTML('header-container', 'header_main.html');
includeHTML('footer-container', 'footer.html');

document.addEventListener("DOMContentLoaded", function() {
    const searchInput = document.getElementById("searchInput");
    
    if (searchInput) {
        searchInput.addEventListener("keyup", function() {
            const filter = this.value.toLowerCase();
            const sections = document.querySelectorAll("main section");

            sections.forEach(function(section) {
                let sectionHasVisibleRows = false;
                
                const tableDivs = section.querySelectorAll(".table-responsive");

                tableDivs.forEach(function(div) {
                    const table = div.querySelector("table");
                    const trs = table.getElementsByTagName("tr");
                    let tableHasVisibleRow = false;

                    for (let i = 0; i < trs.length; i++) {
                        const tr = trs[i];
                        const tds = tr.getElementsByTagName("td");
                        
                        if (tds.length > 1) {
                            const txtName = tds[0].textContent || tds[0].innerText;
                            const txtLoc = tds[1].textContent || tds[1].innerText;

                            if (txtName.toLowerCase().indexOf(filter) > -1 || txtLoc.toLowerCase().indexOf(filter) > -1) {
                                tr.style.display = "";
                                tableHasVisibleRow = true;
                                sectionHasVisibleRows = true;
                            } else {
                                tr.style.display = "none";
                            }
                        }
                    }

                    div.style.display = tableHasVisibleRow ? "" : "none";

                    const districtTitle = div.previousElementSibling;
                    if (districtTitle && districtTitle.tagName === "P") {
                        districtTitle.style.display = tableHasVisibleRow ? "" : "none";
                    }
                });

                section.style.display = sectionHasVisibleRows ? "" : "none";
                
                const hr = section.nextElementSibling;
                if (hr && hr.tagName === "HR") {
                    hr.style.display = sectionHasVisibleRows ? "" : "none";
                }
            });
        });
    }
});