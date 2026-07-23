import Image from "next/image";
import Link from "next/link";
import {ArrowRight} from "lucide-react";

export function NotebookEntry({href,eyebrow,title,description,action}:{href:string;eyebrow:string;title:string;description:string;action:string}) {
  return <aside className="contextual-notebook-entry" aria-labelledby={`notebook-entry-${href.replaceAll(/[^a-zA-Z0-9]/g,"-")}`}>
    <Image src="/assets/brand/bee-memory.png" alt="" width={44} height={44}/>
    <div>
      <p>{eyebrow}</p>
      <h2 id={`notebook-entry-${href.replaceAll(/[^a-zA-Z0-9]/g,"-")}`}>{title}</h2>
      <span>{description}</span>
    </div>
    <Link href={href}>{action}<ArrowRight/></Link>
  </aside>;
}
