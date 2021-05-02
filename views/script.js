function Table(records, start, end, thispage) {
    if (records.length > 0) {
        let table = document.createElement("table");
        let head = document.createElement("tr");
        let td_id = document.createElement("th");
        td_id.appendChild(document.createTextNode("Proverbio n."));
        let td_Testo = document.createElement("th");
        td_Testo.appendChild(document.createTextNode("Testo"));

        head.appendChild(td_id);
        head.appendChild(td_Testo);
        table.appendChild(head);
        records.forEach(record => {
            if (records.indexOf(record) >= start && records.indexOf(record) <= end) {
                let row = document.createElement("tr");
                let td1 = document.createElement("td");
                td1.innerHTML = record["IDProverbio"];
                let td2 = document.createElement("td");
                td2.innerHTML = record["Testo"];
                row.appendChild(td1);
                row.appendChild(td2);
                table.appendChild(tr);
            }
        });
        let p = document.createElement("p");
        let a1 = document.createElement("a");
        let a2 = document.createElement("a");
        let a_middle = document.createElement("a");
        let a3 = document.createElement("a");
        let a4 = document.createElement("a");
        a1.innerHTML = "<<";
        a1.href = "?thispage=1" + "&start=" + start + "&end=" + end;
        a2.innerHTML = "<";
        a2.href = "?thispage=" + (thispage > 1 ? (thispage - 1) : thispage) + "&start=" + start + "&end=" + end;
        a_middle.innerHTML = thispage.toString();
        a3.innerHTML = ">";
        a3.href = "?thispage=" + (thispage < parseInt(records.length / (end - start)) ? thispage + 1 : parseInt(records.length / (end - start))) + "&start=" + start + "&end=" + end;
        a4.innerHTML = ">>";
        a4.href = "?thispage=" + parseInt(records.length / (end - start)) + "&start=" + start + "&end=" + end;
        p.appendChild(a1);
        p.appendChild(a2);
        p.appendChild(a3);
        p.appendChild(a4);
        document.getElementsByClassName("content")[0].appendChild(table);
        document.getElementsByClassName("content")[0].appendChild(p);
    }
}

function FlagsOk() {
    let br = document.createElement("br");
    let contents = document.getElementsByClassName("content");
    for (let i = 0; i < contents.length; i++)
        contents.item(i).appendChild(br);
}