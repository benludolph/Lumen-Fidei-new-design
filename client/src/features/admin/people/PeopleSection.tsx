import { useState } from "react";
import { trackFetch as fetch } from "@/lib/track-context";
import { useUsers } from "@/hooks/use-users";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { TabsContent } from "@/components/ui/tabs";
import { Search, X } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { api } from "@shared/routes";
import type { CohortRecord } from "@/features/admin/types";
import { UserRow } from "./UserRow";

// Keep this component outside TabsContent so its filters survive tab switches.
export function PeopleSection() {
  const { data: users, isLoading } = useUsers();
  const [searchTerm, setSearchTerm] = useState("");
  const [cohortFilter, setCohortFilter] = useState("all");
  const [roleFilter, setRoleFilter] = useState("all");
  const { data: cohortList } = useQuery<CohortRecord[]>({
    queryKey: [api.admin.listCohorts.path],
    queryFn: async () => {
      const res = await fetch(api.admin.listCohorts.path, { credentials: "include" });
      if (!res.ok) throw new Error("Failed to fetch cohorts");
      return res.json();
    },
  });

  const filteredUsers = users?.filter(u => {
    const matchesSearch =
      u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCohort =
      cohortFilter === "all" ||
      (cohortFilter === "no-cohort" && !u.cohortId) ||
      (cohortFilter !== "no-cohort" && u.cohortId === Number(cohortFilter));
    const matchesRole = roleFilter === "all" || u.role === roleFilter;
    return matchesSearch && matchesCohort && matchesRole;
  });

  return (
<TabsContent value="users">
            <Card>
              <CardHeader className="pb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Search className="w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search users..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="max-w-sm"
                    data-testid="input-search-users"
                  />
                  <Select value={cohortFilter} onValueChange={setCohortFilter}>
                    <SelectTrigger className="w-[160px] h-9" data-testid="select-cohort-filter">
                      <SelectValue placeholder="All cohorts" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All cohorts</SelectItem>
                      {(cohortList ?? []).map(c => (
                        <SelectItem key={c.id} value={String(c.id)}>
                          {c.name}
                          {c.status === "archived" ? " (past)" : ""}
                        </SelectItem>
                      ))}
                      <SelectItem value="no-cohort">No cohort assigned</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="w-[140px] h-9" data-testid="select-role-filter">
                      <SelectValue placeholder="All roles" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      <SelectItem value="participant">Participant</SelectItem>
                      <SelectItem value="mentor">Mentor</SelectItem>
                      <SelectItem value="admin">Admin</SelectItem>
                      <SelectItem value="superuser">Superuser</SelectItem>
                    </SelectContent>
                  </Select>
                  {(cohortFilter !== "all" || roleFilter !== "all" || searchTerm) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-9 px-2 text-muted-foreground"
                      data-testid="button-clear-filters"
                      onClick={() => { setCohortFilter("all"); setRoleFilter("all"); setSearchTerm(""); }}
                    >
                      <X className="w-4 h-4 mr-1" /> Clear
                    </Button>
                  )}
                  <span className="text-xs text-muted-foreground ml-auto">
                    {filteredUsers?.length ?? 0} of {users?.length ?? 0} users
                  </span>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Track</TableHead>
                      <TableHead>Variant</TableHead>
                      <TableHead>Mentor</TableHead>
                      <TableHead>Start Date</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">Loading...</TableCell>
                      </TableRow>
                    ) : filteredUsers?.map((u) => (
                      <UserRow key={u.id} user={u} allUsers={users || []} />
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
  );
}
